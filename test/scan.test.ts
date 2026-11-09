import type { ResolvedOptions } from '../src/types'
import { resolve } from 'node:path'
import { expect, it, vi } from 'vitest'
import { scanMiddlewares } from '../src/scan'

const programRoot = resolve(__dirname, 'fixtures')

function options(middlewareDir: string): ResolvedOptions {
  return { middlewareDir, pagesJsonPath: 'pages.json', programRoot }
}

it('derives middleware names from the file path', async () => {
  const files = await scanMiddlewares(options('middleware'))

  expect(files.map(file => file.name)).toEqual(['auth', 'global', 'userProfile', 'userList', 'vip'])
})

it('names an index file after its directory', async () => {
  const files = await scanMiddlewares(options('middleware'))
  const vip = files.find(file => file.name === 'vip')

  expect(vip?.value).toBe('Vip')
  expect(vip?.path.endsWith('middleware/vip/index.ts')).toBe(true)
})

it('warns when two files resolve to the same middleware name', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  const files = await scanMiddlewares(options('duplicate-middleware'))

  expect(files.map(file => file.name)).toEqual(['auth'])
  expect(warn).toHaveBeenCalledTimes(1)
  expect(String(warn.mock.calls[0][0])).toContain('auth')
  warn.mockRestore()
})
