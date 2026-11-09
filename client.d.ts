declare module 'virtual:uni-middleware' {
  // 类型统一从 runtime 导出取，避免这里和 src/runtime/types.ts 各写一份
  import type { Middleware } from '@uni-helper/vite-plugin-uni-middleware/runtime'

  export const middlewares: {
    global: Middleware[]
    [route: string]: Middleware[]
  }
}
