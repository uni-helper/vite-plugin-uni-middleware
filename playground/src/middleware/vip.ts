import { defineMiddleware } from '../../../src/runtime'
import { useStore } from '../store'

export default defineMiddleware((to, from) => {
  const store = useStore()

  if (!store.isVip)
    return '/pages/auth/index'
})
