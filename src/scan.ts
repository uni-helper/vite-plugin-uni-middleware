import type { Middleware, ResolvedOptions } from './types'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { camelCase, pascalCase, splitByCase } from 'scule'
import { glob } from 'tinyglobby'
import { normalizePath } from 'vite'

export async function scanMiddlewares(options: ResolvedOptions): Promise<Middleware[]> {
  const middlewares: Middleware[] = []
  const files = await glob('**/*.(js|ts)', {
    ignore: ['node_modules', '.git', '**/__*__/*'],
    onlyFiles: true,
    cwd: resolve(options.programRoot, options.middlewareDir),
    expandDirectories: false,
  })
  files.sort()
  const dir = resolve(options.programRoot, options.middlewareDir)
  for (const file of files) {
    const filePath = join(dir, file)
    const dirNameParts = splitByCase(
      normalizePath(relative(dir, dirname(filePath))),
    )
    let fileName = basename(filePath, extname(filePath))
    if (fileName.toLowerCase() === 'index') {
      fileName = basename(dirname(filePath))
    }
    const fileNameParts = splitByCase(fileName)
    const middlewareNameParts: string[] = []
    while (
      dirNameParts.length
      && (dirNameParts[0] || '').toLowerCase()
      !== (fileNameParts[0] || '').toLowerCase()
    ) {
      middlewareNameParts.push(dirNameParts.shift()!)
    }
    const middlewareName
      = pascalCase(middlewareNameParts) + pascalCase(fileNameParts)

    const value = pascalCase(middlewareName).replace(/["']/g, '')
    const name = camelCase(value)

    const existing = middlewares.find(m => m.name === name)
    if (existing) {
      console.warn(
        `[vite-plugin-uni-middleware] middleware name "${name}" from ${normalizePath(filePath)} is ignored, ${existing.path} already uses it`,
      )
      continue
    }
    middlewares.push({
      name,
      value,
      path: normalizePath(filePath),
    })
  }
  return middlewares
}
