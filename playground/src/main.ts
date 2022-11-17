import { createSSRApp } from "vue";
import App from "./App.vue";
import { createNavigationGuardPlugin } from "@uni-helper/vite-plugin-uni-middleware/runtime";
export function createApp() {
  const app = createSSRApp(App);
  getCurrentPages()
  const guard = createNavigationGuardPlugin();
  app.use(guard);
  return {
    app,
  };
}
