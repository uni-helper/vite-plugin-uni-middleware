import { defineMiddleware } from '@uni-helper/vite-plugin-uni-middleware/runtime'

export default defineMiddleware((to, _from) => {
  console.warn('global:', to.route)
})
