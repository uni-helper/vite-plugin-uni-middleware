import { defineMiddleware } from '../../../src/runtime'

export default defineMiddleware((to, from) => {
  console.log('global:', to, from)
})
