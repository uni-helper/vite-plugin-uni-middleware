import type { GuardPage, MiddlewareMap, NavigationArgs } from '../src/runtime/guard'
import { expect, it, vi } from 'vitest'
import { createGuard } from '../src/runtime/guard'

interface NavigationCall {
  method: string
  args: NavigationArgs
}

/**
 * 假的 uni 运行时。拦截器语义照 `@dcloudio/uni-h5` 的 `queue` 实现：
 * `invoke` 返回 `false` 取消导航，返回其它值继续用原参数调用。
 */
function createUni() {
  const interceptors = new Map<string, Array<(args: NavigationArgs) => unknown>>()
  const calls: NavigationCall[] = []
  // 平台拒绝的地址(页面不存在、页面栈满等)，用来模拟导航失败
  const failingUrls = new Set<string>()

  function run(method: string, args: NavigationArgs): void {
    for (const invoke of interceptors.get(method) ?? []) {
      if (invoke(args) === false)
        return
    }
    if (failingUrls.has(args.url)) {
      args.fail?.({ errMsg: `${method}:fail` })
      args.complete?.({ errMsg: `${method}:fail` })
      return
    }
    calls.push({ method, args })
    args.success?.({ errMsg: `${method}:ok` })
    args.complete?.({ errMsg: `${method}:ok` })
  }

  const uni = {
    addInterceptor(method: string, hook: { invoke: (args: NavigationArgs) => unknown }): void {
      interceptors.set(method, [...(interceptors.get(method) ?? []), hook.invoke])
    },
    navigateTo: (args: NavigationArgs) => run('navigateTo', args),
    redirectTo: (args: NavigationArgs) => run('redirectTo', args),
    reLaunch: (args: NavigationArgs) => run('reLaunch', args),
    switchTab: (args: NavigationArgs) => run('switchTab', args),
    navigateBack: (args: Record<string, unknown> = {}) => run('navigateBack', { url: '', ...args }),
  }

  return { uni, calls, failingUrls }
}

function createPage(route: string, fullPath = `/${route}`): GuardPage {
  return { route, $page: { fullPath } }
}

function setup(middlewares: MiddlewareMap, stack: GuardPage[], reportError = vi.fn()) {
  const { uni, calls, failingUrls } = createUni()
  const guard = createGuard({ uni, getPages: () => stack, middlewares, reportError })
  guard.install()
  return { uni, calls, failingUrls, guard, reportError, stack }
}

it('runs middlewares before navigating and leaves the navigation untouched', () => {
  const middleware = vi.fn()
  const { uni, calls } = setup({ global: [middleware] }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/home/index?id=1' })

  expect(middleware).toHaveBeenCalledTimes(1)
  expect(calls.map(call => [call.method, call.args.url])).toEqual([['navigateTo', '/pages/home/index?id=1']])
})

it('gives middlewares the target and current page as route locations', () => {
  const middleware = vi.fn()
  const { uni } = setup({ global: [middleware] }, [createPage('pages/home/index', '/pages/home/index?tab=1')])

  uni.navigateTo({ url: '/pages/vip/index?level=2' })

  expect(middleware).toHaveBeenCalledWith(
    { route: 'pages/vip/index', url: '/pages/vip/index?level=2' },
    { route: 'pages/home/index', url: '/pages/home/index?tab=1' },
  )
})

it('cancels the navigation and redirects when a middleware returns a url', () => {
  const { uni, calls } = setup({ 'pages/secret/index': [() => '/pages/login/index'] }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/secret/index' })

  expect(calls).toEqual([{ method: 'redirectTo', args: { url: '/pages/login/index' } }])
})

it('uses the method from an object result and falls back to redirectTo', () => {
  const { uni, calls } = setup({
    'pages/a/index': [() => ({ url: '/pages/login/index', method: 'reLaunch' })],
    'pages/b/index': [() => ({ url: '/pages/login/index' })],
  }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/a/index' })
  uni.navigateTo({ url: '/pages/b/index' })

  expect(calls).toEqual([
    { method: 'reLaunch', args: { url: '/pages/login/index' } },
    { method: 'redirectTo', args: { url: '/pages/login/index' } },
  ])
})

it('stops at the first middleware that blocks', () => {
  const second = vi.fn(() => '/pages/other/index')
  const { uni, calls } = setup({ global: [() => '/pages/login/index', second] }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/secret/index' })

  expect(second).not.toHaveBeenCalled()
  expect(calls.map(call => call.args.url)).toEqual(['/pages/login/index'])
})

it('runs global middlewares before page middlewares', () => {
  const order: string[] = []
  const { uni } = setup({
    'global': [() => {
      order.push('global')
    }],
    'pages/a/index': [() => {
      order.push('page')
    }],
  }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/a/index' })

  expect(order).toEqual(['global', 'page'])
})

it('waits for an async middleware before letting the navigation through', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const middleware = vi.fn(async () => {
    await gate
  })
  const { uni, calls } = setup({ global: [middleware] }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/a/index' })
  expect(calls).toHaveLength(0)

  release()
  await vi.waitFor(() => expect(calls).toHaveLength(1))

  expect(calls[0].method).toBe('navigateTo')
  expect(calls[0].args.url).toBe('/pages/a/index')
  expect(middleware).toHaveBeenCalledTimes(1)
})

it('waits for an async middleware before redirecting', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const { uni, calls } = setup({
    'pages/secret/index': [async () => {
      await gate
      return '/pages/login/index'
    }],
  }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/secret/index' })
  expect(calls).toHaveLength(0)

  release()
  await vi.waitFor(() => expect(calls).toHaveLength(1))

  expect(calls[0]).toEqual({ method: 'redirectTo', args: { url: '/pages/login/index' } })
})

it('cancels the navigation when a middleware returns false', () => {
  const { uni, calls } = setup({ global: [() => false] }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/secret/index' })

  expect(calls).toHaveLength(0)
})

it('reports a broken middleware and lets the navigation continue', () => {
  const error = new Error('boom')
  const { uni, calls, reportError } = setup({
    global: [() => {
      throw error
    }],
  }, [createPage('pages/home/index')])

  uni.navigateTo({ url: '/pages/a/index' })

  expect(reportError).toHaveBeenCalledWith(error)
  expect(calls.map(call => call.method)).toEqual(['navigateTo'])
})

it('guards a tab bar entry that never reaches the navigation apis', () => {
  const middleware = vi.fn(() => '/pages/login/index')
  const stack = [createPage('pages/home/index')]
  const { guard, calls } = setup({ 'pages/vip/index': [middleware] }, stack)

  guard.handlePageShow()
  expect(calls).toHaveLength(0)

  stack.push(createPage('pages/vip/index'))
  guard.handlePageShow()

  expect(calls).toEqual([{ method: 'redirectTo', args: { url: '/pages/login/index' } }])
  expect(middleware).toHaveBeenCalledWith(
    { route: 'pages/vip/index', url: '/pages/vip/index' },
    { route: 'pages/home/index', url: '/pages/home/index' },
  )
})

it('waits for an async middleware on the onShow fallback', async () => {
  const stack = [createPage('pages/secret/index')]
  const { guard, calls } = setup({ 'pages/secret/index': [async () => '/pages/login/index'] }, stack)

  guard.handlePageShow()
  expect(calls).toHaveLength(0)

  await vi.waitFor(() => expect(calls).toHaveLength(1))
  expect(calls[0].method).toBe('redirectTo')
})

it('does not run middlewares again when the same page shows twice', () => {
  const middleware = vi.fn()
  const stack = [createPage('pages/vip/index')]
  const { guard } = setup({ global: [middleware] }, stack)

  guard.handlePageShow()
  guard.handlePageShow()

  expect(middleware).toHaveBeenCalledTimes(1)
})

it('does not run middlewares again for a page the interceptor already allowed', () => {
  const middleware = vi.fn()
  const stack = [createPage('pages/home/index')]
  const { uni, guard } = setup({ global: [middleware] }, stack)

  uni.navigateTo({ url: '/pages/vip/index' })
  stack.push(createPage('pages/vip/index'))
  guard.handlePageShow()

  expect(middleware).toHaveBeenCalledTimes(1)
})

it('goes back when a shown page is blocked and the stack has a previous page', () => {
  const stack = [createPage('pages/home/index'), createPage('pages/secret/index')]
  const { guard, calls } = setup({ 'pages/secret/index': [() => false] }, stack)

  guard.handlePageShow()

  expect(calls).toEqual([{ method: 'navigateBack', args: { url: '' } }])
})

it('reports a blocked first page instead of navigating nowhere', () => {
  const stack = [createPage('pages/secret/index')]
  const { guard, calls, reportError } = setup({ 'pages/secret/index': [() => false] }, stack)

  guard.handlePageShow()

  expect(calls).toHaveLength(0)
  expect(reportError).toHaveBeenCalledTimes(1)
})

it('stops two pages that redirect to each other', () => {
  const middlewares: MiddlewareMap = {
    'pages/a/index': [() => '/pages/b/index'],
    'pages/b/index': [() => '/pages/a/index'],
  }
  const stack = [createPage('pages/a/index')]
  const { guard, calls, reportError } = setup(middlewares, stack)

  guard.handlePageShow()
  expect(calls.map(call => call.args.url)).toEqual(['/pages/b/index'])

  stack.splice(0, stack.length, createPage('pages/b/index'))
  guard.handlePageShow()

  expect(calls).toHaveLength(1)
  expect(reportError).toHaveBeenCalledTimes(1)
})

it('re-checks a route whose first navigation the platform rejected', () => {
  const store = { isLogin: true }
  const stack = [createPage('pages/home/index')]
  const { uni, calls, failingUrls, guard } = setup({
    'pages/vip/index': [() => store.isLogin ? undefined : '/pages/login/index'],
  }, stack)

  // 中间件放行，但平台拒绝了这次导航(页面栈满、地址不存在)，页面并没有打开
  failingUrls.add('/pages/vip/index')
  uni.navigateTo({ url: '/pages/vip/index' })
  expect(calls).toHaveLength(0)

  // 用户退出登录后改从 TabBar 进入同一个页面，拦截器不会执行
  store.isLogin = false
  stack.push(createPage('pages/vip/index'))
  guard.handlePageShow()

  expect(calls).toEqual([{ method: 'redirectTo', args: { url: '/pages/login/index' } }])
})

it('re-checks a page after the guard redirected away from it', () => {
  const stack = [createPage('pages/vip/index')]
  const { calls, guard } = setup({
    'pages/vip/index': [() => ({ url: '/pages/login/index', method: 'navigateTo' })],
  }, stack)

  guard.handlePageShow()
  expect(calls.map(call => call.method)).toEqual(['navigateTo'])

  // navigateTo 之后原页面还在栈里，用户按返回又回到它
  stack.splice(0, stack.length, createPage('pages/vip/index'))
  guard.handlePageShow()

  expect(calls.map(call => call.method)).toEqual(['navigateTo', 'navigateTo'])
})
