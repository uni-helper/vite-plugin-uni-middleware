import { createSSRApp } from "vue";
import App from "./App.vue";
import { createNavigationGuardPlugin } from "@uni-helper/vite-plugin-uni-middleware/runtime";
import { createPinia } from "pinia";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  const guard = createNavigationGuardPlugin();
  app.use(pinia);
  app.use(guard);
  return {
    app,
  };
}
