/** 中间件拿到的页面地址 */
export interface RouteLocation {
  /** 页面路径，不带前导斜杠，例如 `pages/login/index`，与 `getCurrentPages()` 里的 `page.route` 一致 */
  route: string
  /**
   * 完整地址，带前导斜杠和查询串，例如 `/pages/login/index?from=home`。
   * 由 `onShow` 兜底进入的页面取不到查询串，这时只有 `/` 加 `route`。
   */
  url: string
}

/** 中间件可以指定使用的跳转 API */
export type NavigateMethod = 'navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab'

/**
 * 中间件返回值。
 * - `undefined` / `true`：放行
 * - `false`：取消本次导航；页面已经显示时(兜底路径)回退一页
 * - `string`：视为跳转地址，用 `uni.redirectTo` 跳转
 * - 对象：可指定跳转方式，`method` 默认 `redirectTo`
 */
export type MiddlewareReturn
  = | void
    | boolean
    | string
    | {
      url: string
      method?: NavigateMethod
      options?: Record<string, unknown>
    }

export type Middleware = (to: RouteLocation, from?: RouteLocation) => MiddlewareReturn | Promise<MiddlewareReturn>
