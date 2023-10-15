import process from 'node:process'
import { defineConfig } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniMiddleware from '@uni-helper/vite-plugin-uni-middleware'

// https://vitejs.dev/config/
export default defineConfig({
  mode: 'test',
  plugins: [
    {
      name: 'test-env',
      buildStart() {
        process.env.NODE_ENV = 'test'
      },
    },
    UniPages({
      dts: 'src/uni-pages.d.ts',
    }),
    UniMiddleware(),
    Uni(),
  ],
})
