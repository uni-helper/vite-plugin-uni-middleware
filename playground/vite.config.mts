import Uni from '@uni-helper/plugin-uni'
import UniMiddleware from '@uni-helper/vite-plugin-uni-middleware'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [UniPages(), Uni(), UniMiddleware({
    middlewareDir: 'src/middleware',
  })],
})
