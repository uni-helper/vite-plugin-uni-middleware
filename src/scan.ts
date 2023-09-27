import { basename, dirname, extname, join, relative } from 'node:path'
import fg from 'fast-glob'
import { camelCase, pascalCase, splitByCase } from 'scule'
import { normalizePath } from 'vite'
import type { MiddlewareFile, ResolvedOptions } from './types'

export async function scanMiddlewares(options: ResolvedOptions) {
  const middlewares: MiddlewareFile[] = []
  const files = await fg('**/*.(js|ts)', {
    ignore: ['node_modules', '.git', '**/__*__/*'],
    onlyFiles: true,
    cwd: options.middlewareDir,
  })
  files.sort()
  const dir = options.middlewareDir
  for (const file of files) {
    const filePath = join(dir, file)
    const dirNameParts = splitByCase(
      normalizePath(relative(dir, dirname(filePath))),
    )
    let fileName = basename(filePath, extname(filePath))
    if (fileName.toLowerCase() === 'index')
      fileName = basename(dirname(filePath))

    const fileNameParts = splitByCase(fileName)
    const middlewareNameParts: string[] = []
    while (
      dirNameParts.length
      && (dirNameParts[0] || '').toLowerCase()
        !== (fileNameParts[0] || '').toLowerCase()
    )
      middlewareNameParts.push(dirNameParts.shift()!)

    const middlewareName
      = pascalCase(middlewareNameParts) + pascalCase(fileNameParts)

    const value = pascalCase(middlewareName).replace(/["']/g, '')
    const name = camelCase(value)

    if (!middlewares.find(m => m.name === name)) {
      middlewares.push({
        name,
        value,
        path: normalizePath(filePath),
      })
    }
  }

  return middlewares
}
