import { createNavigationGuardPlugin } from '@uni-helper/vite-plugin-uni-middleware/runtime'
import { createPinia } from 'pinia'
import { middlewares } from 'virtual:uni-middleware'
import { createSSRApp } from 'vue'
import App from './App.vue'

// eslint-disable-next-line ts/explicit-function-return-type
export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  const guard = createNavigationGuardPlugin(middlewares)
  app.use(pinia)
  app.use(guard)
  return {
    app,
  }
}
