/// <reference types="vite/client" />
/// <reference types="@uni-helper/vite-plugin-uni-pages/client" />
/// <reference types="@uni-helper/vite-plugin-uni-middleware/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}
