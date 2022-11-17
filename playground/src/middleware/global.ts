import { defineMiddleware } from "@uni-helper/vite-plugin-uni-middleware/runtime";

export default defineMiddleware((to, from) => {
  console.log("global:", to, from);
});
