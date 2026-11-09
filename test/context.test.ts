import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { Context } from '../src/context'

const root = resolve(__dirname, 'fixtures')

function createContext(pagesJsonPath: string): Context {
  return new Context({ middlewareDir: 'middleware', pagesJsonPath, programRoot: root })
}

it('collects global and page middlewares into the virtual module', async () => {
  const code = await createContext('pages.json').virtualModule()

  expect(code).toContain('global: [Global]')
  expect(code).toContain('"pages/index/index": [Auth]')
  expect(code).toContain('"pages/vip/index": [Vip]')
})

it('runs page middlewares in the order pages.json lists them', async () => {
  const code = await createContext('pages.json').virtualModule()

  // 扫描顺序是 auth 在前，pages.json 里 vip 写在前面就得先跑 vip
  expect(code).toContain('"pages/order/index": [Vip,Auth]')
})

it('names the pages.json path when the file cannot be parsed', async () => {
  await expect(createContext('invalid-pages.json').virtualModule()).rejects.toThrow('invalid-pages.json')
})
