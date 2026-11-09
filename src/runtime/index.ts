import type { ObjectPlugin } from 'vue'
import type { GuardPage, GuardUni, MiddlewareMap } from './guard'
import type { Middleware } from './types'
import { createGuard } from './guard'

export * from './types'

/** 标记中间件函数，拿到 `to` / `from` 的类型提示 */
export function defineMiddleware(middleware: Middleware): Middleware {
  return middleware
}

/**
 * 创建导航守卫插件，在 `main.ts` 里 `app.use()` 注册。
 *
 * 拦截器在 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab` 调用时先跑中间件，
 * 被拦下的导航不会发生。TabBar 点击、冷启动、H5 直接改地址不经过这四个 API，
 * 由页面 `onShow` 兜底检查。
 *
 * 中间件表由调用方传入，这里不 import `virtual:uni-middleware`。虚拟模块 import 中间件文件，
 * 中间件文件又 import 本模块，uni-app 会把两头打包成互相 require 的 chunk。
 *
 * @param middlewares `virtual:uni-middleware` 导出的中间件表
 */
export function createNavigationGuardPlugin(middlewares: MiddlewareMap): ObjectPlugin {
  // 传错会让鉴权中间件静默失效，所以这里直接报错
  if (!middlewares) {
    throw new Error(
      '[vite-plugin-uni-middleware] createNavigationGuardPlugin() needs the middlewares from `virtual:uni-middleware`',
    )
  }

  const guard = createGuard({
    // SAFETY: uni 每个 API 的参数类型各自定义，守卫只传 url 和三个回调，这是四个导航 API 的公共部分
    uni: uni as unknown as GuardUni,
    // SAFETY: 守卫只读页面栈里的 route 和 $page.fullPath，这两个字段各端都有，@dcloudio/types 没声明
    getPages: () => getCurrentPages() as unknown as GuardPage[],
    middlewares,
    reportError: (error: unknown) => console.error('[vite-plugin-uni-middleware]', error),
  })

  return {
    install(app) {
      guard.install()
      app.mixin({
        // 页面 show 时才需要兜底；这里不关心页面实例，守卫自己读页面栈
        onShow() {
          guard.handlePageShow()
        },
      })
    },
  }
}
