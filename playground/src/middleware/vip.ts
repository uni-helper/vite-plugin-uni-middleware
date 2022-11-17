import { defineMiddleware } from "@uni-helper/vite-plugin-uni-middleware/runtime";
import { useStore } from "../store";

export default defineMiddleware((to, from) => {
  const store = useStore();

  if (!store.isVip) {
    return "/pages/auth/index";
  }
});
