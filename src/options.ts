import process from 'node:process'
import { inputDir } from '@uni-helper/uni-env'
import { normalizePath } from 'vite'
import type { ResolvedOptions, UserOptions } from './types'

export function resolvedOptions(options: UserOptions): ResolvedOptions {
  const cwd = inputDir ?? process.cwd()
  return {
    cwd,
    dts: 'uni-middleware.d.ts',
    middlewareDir: normalizePath(`${cwd}/middleware`),
    pagesJsonPath: normalizePath(`${cwd}/pages.json`),
    ...options,
  }
}
