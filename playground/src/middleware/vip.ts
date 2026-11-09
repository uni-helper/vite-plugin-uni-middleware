import { defineMiddleware } from '@uni-helper/vite-plugin-uni-middleware/runtime'
import { useStore } from '../store'

export default defineMiddleware((_to, _from) => {
  const store = useStore()

  if (!store.isVip) {
    return '/pages/auth/index'
  }
})
