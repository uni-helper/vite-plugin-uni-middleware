import type { ModuleNode, Plugin } from 'vite'
import type { ResolvedOptions, UserOptions } from './types'
import { resolve } from 'node:path'
import process from 'node:process'
import { normalizePath } from 'vite'
import { resolvedVirtualModuleId, virtualModuleId } from './constant'
import { Context } from './context'

function resolveOptions(userOptions: UserOptions): ResolvedOptions {
  return {
    middlewareDir: 'src/middleware',
    pagesJsonPath: 'src/pages.json',
    programRoot: process.cwd(),
    ...userOptions,
  }
}

export function VitePluginUniMiddleware(userOptions: UserOptions = {}): Plugin {
  const options = resolveOptions(userOptions)
  const ctx = new Context(options)
  return {
    name: 'vite-plugin-uni-middleware',
    configureServer({ watcher, moduleGraph, ws }) {
      // 与 context 用同一个根目录，否则 config.root 和 programRoot 不同时监听不到正确的文件
      const pagesJsonPath = normalizePath(
        resolve(options.programRoot, options.pagesJsonPath),
      )
      watcher.add(pagesJsonPath)
      const reloadModule = (module: ModuleNode | undefined, path = '*'): void => {
        if (module) {
          moduleGraph.invalidateModule(module)
          if (ws) {
            ws.send({
              path,
              type: 'full-reload',
            })
          }
        }
      }
      const updateVirtualModule = (): void => {
        const module = moduleGraph.getModuleById(resolvedVirtualModuleId)
        reloadModule(module)
      }

      watcher.on('change', async (path) => {
        path = normalizePath(path)
        if (pagesJsonPath === path || path.includes(options.middlewareDir)) {
          updateVirtualModule()
        }
      })
      watcher.on('add', async (path) => {
        path = normalizePath(path)
        if (path.includes(options.middlewareDir)) {
          updateVirtualModule()
        }
      })
      watcher.on('unlink', async (path) => {
        path = normalizePath(path)
        if (path.includes(options.middlewareDir)) {
          updateVirtualModule()
        }
      })
    },
    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return ctx.virtualModule()
      }
    },
  }
}

export default VitePluginUniMiddleware
