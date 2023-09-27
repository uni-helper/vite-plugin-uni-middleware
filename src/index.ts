import { createFilter } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'

import { Context } from './context'
import type { UserOptions } from './types'
import { resolvedVirtualModuleId, virtualModuleId, vitePluginName } from './constant'

export function VitePluginUniMiddleware(options?: UserOptions): Plugin {
  const ctx = new Context(options)
  return {
    name: vitePluginName,
    enforce: 'pre',
    configResolved(_config) {
      ctx.config = _config
    },
    configureServer(server: ViteDevServer) {
      ctx.setupServer(server)
    },
    transform(code, id) {
      const filter = createFilter(`${ctx.options.cwd}/main.[tj]s`)
      if (filter(id))
        return ctx.transformMain(code, id)
    },

    async resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    load(id) {
      if (id === resolvedVirtualModuleId)
        return ctx.virtualModule()
    },
  }
}

export default VitePluginUniMiddleware
