import type { Middleware, MiddlewareReturn, NavigateMethod, RouteLocation } from './types'

/**
 * 运行时用到的 uni API 子集。抽成接口是为了在测试里换成假实现，
 * 也避免直接依赖全局 `uni` 的庞大类型。
 */
export interface GuardUni {
  addInterceptor: (method: string, hook: { invoke: (args: NavigationArgs) => unknown }) => void
  navigateTo: (args: NavigationArgs) => unknown
  redirectTo: (args: NavigationArgs) => unknown
  reLaunch: (args: NavigationArgs) => unknown
  switchTab: (args: NavigationArgs) => unknown
  navigateBack: (args?: Record<string, unknown>) => unknown
}

export interface NavigationArgs {
  url: string
  success?: (result: unknown) => void
  fail?: (result: unknown) => void
  complete?: (result: unknown) => void
  [key: string]: unknown
}

/** 页面栈里的页面，只取拦截需要用到的字段 */
export interface GuardPage {
  route: string
  $page?: { fullPath?: string }
}

/** 虚拟模块 `virtual:uni-middleware` 导出的形状 */
export interface MiddlewareMap {
  global?: Middleware[]
  [route: string]: Middleware[] | undefined
}

export interface GuardOptions {
  uni: GuardUni
  /** 读取页面栈，等价于 `getCurrentPages()` */
  getPages: () => GuardPage[]
  /** 全局与页面级中间件，key 为页面 route */
  middlewares: MiddlewareMap
  reportError?: (error: unknown) => void
}

export interface Guard {
  /** 注册四个导航 API 的拦截器 */
  install: () => void
  /** 在页面 `onShow` 里调用，兜住拦截器看不到的入口 */
  handlePageShow: () => void
}

type Action
  = | { type: 'block' }
    | { type: 'navigate', method: NavigateMethod, url: string, options: Record<string, unknown> }

/**
 * 同步跑完时给出 `action`；中间件返回 Promise 时给出 `promise`，等结果出来再决定怎么导航。
 * 这样同步中间件保持“平台原样执行”，异步中间件也不会被调用两次。
 */
type Evaluation = { action: Action | undefined } | { promise: Promise<Action | undefined> }

const NAVIGATE_METHODS: NavigateMethod[] = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

/**
 * 创建导航守卫。拦截器负责在跳转前判定，`onShow` 兜住拦截器看不到的入口
 * (TabBar 点击、冷启动、H5 直接改地址)。
 */
export function createGuard(options: GuardOptions): Guard {
  const { uni, getPages, middlewares } = options
  const reportError = options.reportError ?? ((error: unknown) => console.error('[vite-plugin-uni-middleware]', error))

  // 守卫自己发起的导航会再次进入拦截器，用 bypass 放行，否则会递归
  let bypass = false
  // 拦截器已放行、页面还没显示出来的 route，onShow 兜底时不再重复执行中间件
  let allowedRoute: string | undefined
  // 最近显示过的页面。同一页面再次 onShow(如从后台切回)时不重复执行
  let shownRoute: string | undefined
  // 兜底路径已经离开的页面，用来拦住 A→B→A 这种互相重定向
  const redirectChain: string[] = []

  function toLocation(page: GuardPage): RouteLocation {
    return {
      route: page.route,
      url: page.$page?.fullPath || `/${page.route}`,
    }
  }

  function locationOfUrl(url: string): RouteLocation | undefined {
    const route = url.split('?')[0].replace(/^\/+/, '')
    return route ? { route, url } : undefined
  }

  function middlewaresFor(route: string): Middleware[] {
    return [...(middlewares.global ?? []), ...(middlewares[route] ?? [])]
  }

  function toAction(result: MiddlewareReturn | undefined): Action | undefined {
    if (result === undefined || result === true)
      return undefined
    if (result === false)
      return { type: 'block' }
    if (typeof result === 'string')
      return { type: 'navigate', method: 'redirectTo', url: result, options: {} }
    return { type: 'navigate', method: result.method ?? 'redirectTo', url: result.url, options: result.options ?? {} }
  }

  function evaluate(to: RouteLocation, from: RouteLocation | undefined): Evaluation {
    const list = middlewaresFor(to.route)
    for (let index = 0; index < list.length; index++) {
      const middleware = list[index]
      let result: MiddlewareReturn | Promise<MiddlewareReturn>
      try {
        result = middleware(to, from)
      }
      catch (error) {
        // 中间件报错就继续，一个坏中间件不该把用户困在原地；错误照样上报
        reportError(error)
        continue
      }
      if (isPromise(result))
        return { promise: continueAsync(list, index, result, to, from) }
      const action = toAction(result)
      if (action)
        return { action }
    }
    return { action: undefined }
  }

  async function continueAsync(
    list: Middleware[],
    start: number,
    first: Promise<MiddlewareReturn>,
    to: RouteLocation,
    from: RouteLocation | undefined,
  ): Promise<Action | undefined> {
    let result: MiddlewareReturn | undefined
    try {
      result = await first
    }
    catch (error) {
      reportError(error)
    }

    for (let index = start; index < list.length; index++) {
      if (index > start) {
        try {
          result = await list[index](to, from)
        }
        catch (error) {
          reportError(error)
          result = undefined
        }
      }
      const action = toAction(result)
      if (action)
        return action
    }
    return undefined
  }

  /** 执行中间件给出的跳转。`args` 存在时把调用方回调带过去，让调用方的 Promise 能正常结束 */
  function apply(action: Action, args?: NavigationArgs): void {
    if (action.type === 'block')
      return

    const call: NavigationArgs = { ...action.options, url: action.url }
    if (args) {
      call.success = args.success
      call.fail = args.fail
      call.complete = args.complete
    }
    bypass = true
    try {
      uni[action.method](call)
    }
    finally {
      bypass = false
    }
  }

  /** 按调用方原本的方式重新发起导航(用于异步中间件放行的情况) */
  function replay(method: NavigateMethod, args: NavigationArgs): void {
    bypass = true
    try {
      uni[method]({ ...args })
    }
    finally {
      bypass = false
    }
  }

  function allow(method: NavigateMethod, args: NavigationArgs, route: string): void {
    allowedRoute = route
    clearAllowedOnFail(args, route)
    replay(method, args)
  }

  /**
   * 平台导航失败时清掉“已放行”标记。否则下一次不经拦截器的入口
   * (TabBar 点击、冷启动)进入同一个 route 时会跳过中间件。
   */
  function clearAllowedOnFail(args: NavigationArgs, route: string): void {
    const fail = args.fail
    args.fail = (result) => {
      if (allowedRoute === route)
        allowedRoute = undefined
      fail?.(result)
    }
  }

  function lastPageLocation(): RouteLocation | undefined {
    const pages = getPages()
    const page = pages[pages.length - 1]
    return page ? toLocation(page) : undefined
  }

  function intercept(method: NavigateMethod, args: NavigationArgs): NavigationArgs | false {
    if (bypass)
      return args

    const to = typeof args?.url === 'string' ? locationOfUrl(args.url) : undefined
    if (!to)
      return args

    // 新的一次导航开始，上一次“已放行”的标记不再可信
    allowedRoute = undefined
    const evaluation = evaluate(to, lastPageLocation())

    if ('promise' in evaluation) {
      // 同步拿不到结论：先取消这次导航(返回 false)，等中间件给出结果后自己发起
      void evaluation.promise.then((action) => {
        if (action)
          apply(action, args)
        else
          allow(method, args, to.route)
      })
      return false
    }

    if (!evaluation.action) {
      // 同步放行，交给平台按原样执行
      allowedRoute = to.route
      clearAllowedOnFail(args, to.route)
      return args
    }

    apply(evaluation.action, args)
    return false
  }

  function settleShown(action: Action | undefined, route: string): void {
    if (!action) {
      redirectChain.length = 0
      return
    }
    if (action.type === 'block') {
      if (getPages().length < 2) {
        reportError(new Error(`middleware returned false on ${route}, but it is the first page in the stack, so there is nothing to go back to; return a redirect url instead`))
        return
      }
      // 离开当前页面后，它再次显示时要重新检查
      shownRoute = undefined
      bypass = true
      try {
        uni.navigateBack({})
      }
      finally {
        bypass = false
      }
      return
    }
    const target = locationOfUrl(action.url)?.route
    if (target && redirectChain.includes(target)) {
      reportError(new Error(`middlewares redirect between ${route} and ${target} in a loop, stopped`))
      return
    }
    redirectChain.push(route)
    // 目标页面被 navigateTo 打开时，原页面还留在栈里；用户返回后要重新检查
    shownRoute = undefined
    apply(action)
  }

  /**
   * 页面显示后的兜底检查。拦截器没覆盖到的入口在这里判定，
   * 拦截器已放行和同一页面重复显示的则直接跳过。
   */
  function handlePageShow(): void {
    const pages = getPages()
    const page = pages[pages.length - 1]
    if (!page)
      return

    const wasAllowed = allowedRoute === page.route
    allowedRoute = undefined
    if (wasAllowed)
      redirectChain.length = 0
    if (page.route === shownRoute)
      return
    shownRoute = page.route
    if (wasAllowed)
      return

    const previous = pages[pages.length - 2]
    const evaluation = evaluate(toLocation(page), previous ? toLocation(previous) : undefined)
    if ('promise' in evaluation)
      void evaluation.promise.then(action => settleShown(action, page.route))
    else
      settleShown(evaluation.action, page.route)
  }

  /** 注册四个导航 API 的拦截器；重复调用会重复注册，插件只调用一次 */
  function install(): void {
    for (const method of NAVIGATE_METHODS)
      uni.addInterceptor(method, { invoke: args => intercept(method, args) })
  }

  return { handlePageShow, install }
}

function isPromise(value: unknown): value is Promise<MiddlewareReturn> {
  return typeof (value as PromiseLike<unknown> | undefined)?.then === 'function'
}
