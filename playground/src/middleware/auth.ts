import { defineMiddleware } from '../../../src/runtime'
import { useStore } from '../store'

export default defineMiddleware((to, from) => {
  const store = useStore()

  if (!store.isLogin)
    return '/pages/login/index'
})
