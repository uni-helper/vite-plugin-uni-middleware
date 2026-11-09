import { expect, it } from 'vitest'
import { createNavigationGuardPlugin } from '../src/runtime'

it('refuses to create a guard without the middleware map', () => {
  // 漏传中间件表时必须报错。静默跳过会让鉴权中间件失效，页面却正常显示
  // @ts-expect-error 中间件表是必填参数
  expect(() => createNavigationGuardPlugin()).toThrow('virtual:uni-middleware')
})
