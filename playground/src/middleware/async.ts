import { defineMiddleware } from '../../../src/runtime'
import { useStore } from '../store'

function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export default defineMiddleware(async (to, from) => {
  await sleep(2000)
  return false
})
