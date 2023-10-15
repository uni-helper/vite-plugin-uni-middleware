import type { ComponentPublicInstance } from 'vue'

export interface Page extends ComponentPublicInstance {
  $mpType: string
  $pages: Record<string, any>
  $vm: Page
  route: string
}

export type MiddlewareReturn =
  | void
  | boolean
  | string
  | {
    url: string
    method?: 'navigateTo' | 'redirectTo' | 'switchTab' | 'reLaunch'
    options?: Record<string, any>
  }
export type Middleware = (to: Page, from?: Page) => MiddlewareReturn | Promise<MiddlewareReturn>
