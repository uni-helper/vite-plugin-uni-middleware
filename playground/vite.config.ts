import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import UniPages from "@uni-helper/vite-plugin-uni-pages";
import UniMiddleware from "@uni-helper/vite-plugin-uni-middleware";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [UniPages(), uni(), UniMiddleware()],
});
