import process from 'node:process'
import { type ModuleNode, type ResolvedConfig, type ViteDevServer, normalizePath } from 'vite'
import { watchConfig } from 'c12'
import MagicString from 'magic-string'
import type { PagesConfig } from '@uni-helper/vite-plugin-uni-pages'
import { resolvedOptions } from './options'
import type { MiddlewareFile, ResolvedOptions, UserOptions } from './types'
import { resolvedVirtualModuleId } from './constant'
import { scanMiddlewares } from './scan'

export class Context {
  options: ResolvedOptions
  config!: ResolvedConfig
  server?: ViteDevServer
  updateVirtualModule: (() => void) | undefined
  unwatchPageJson: (() => Promise<void>) | undefined
  pagesJson: PagesConfig = {}
  middlewareFiles: MiddlewareFile[] = []

  constructor(options: UserOptions = {}) {
    this.options = resolvedOptions(options)
    this.setupPagesJson()
  }

  setupServer(server: ViteDevServer) {
    this.server = server
    const { ws, moduleGraph, watcher } = server
    const reloadModule = (module: ModuleNode | undefined, path = '*') => {
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
    const updateVirtualModule = () => {
      const module = moduleGraph.getModuleById(resolvedVirtualModuleId)
      reloadModule(module)
    }

    this.updateVirtualModule = updateVirtualModule

    watcher.on('change', async (path) => {
      path = normalizePath(path)
      if (path.includes(this.options.middlewareDir))
        updateVirtualModule()
    })
    watcher.on('add', async (path) => {
      path = normalizePath(path)
      if (path.includes(this.options.middlewareDir))
        updateVirtualModule()
    })
    watcher.on('unlink', async (path) => {
      path = normalizePath(path)
      if (path.includes(this.options.middlewareDir))
        updateVirtualModule()
    })
  }

  async setupPagesJson() {
    const { config, unwatch } = await watchConfig<PagesConfig>({
      rcFile: false,
      cwd: this.options.cwd,
      configFile: this.options.pagesJsonPath,
      packageJson: false,
      onUpdate: (context) => {
        this.pagesJson = context.newConfig.config ?? {}
        this.updateVirtualModule?.()
      },
    })
    this.pagesJson = config ?? {}
    this.unwatchPageJson = unwatch
  }

  transformMain(code: string, id: string) {
    const s = new MagicString(code)
    const isJiti = process.env.JITI === 'true' || process.env.JITI
    const moduleName = isJiti ? '../../src/runtime' : '@uni-helper/vite-plugin-uni-middleware/runtime'
    s.prepend(`import { createUniMiddleware } from \'${moduleName}\';\n`)
    s.replace(
      /(createApp[\s\S]*?)(return\s{\s*app)/,
      '$1const uniMiddleware = createUniMiddleware();\napp.use(uniMiddleware);\n$2',
    )

    return {
      code: s.toString(),
      map: s.generateMap({
        source: id,
        file: `${id}.map`,
        includeContent: true,
      }),
    }
  }

  async virtualModule() {
    this.middlewareFiles = await scanMiddlewares(this.options)
    return `${this.middlewareImports.join('\n')}
export const globalMiddlewares = [${this.globalMiddlewares.map(v => v.value).join(',')}]
export const middlewares = {
  ${this.pagesMiddlewaresCode.join(',\n')}
}`
  }

  get pagesMiddlewaresCode() {
    return this.pagesMiddlewares.map(
      v => `"${v.key}": [${v.value.map(v => v.value).join(',')}]`,
    )
  }

  get middlewareImports() {
    return this.middlewareFiles.map(v => `import ${v.value} from "${v.path}";`)
  }

  get globalMiddlewares() {
    return this.findMiddlewaresByMiddlewareNameList(this.pagesJson.middleware)
  }

  get pagesMiddlewares() {
    if (!this.pagesJson.pages)
      return []

    return this.pagesJson.pages.map((page) => {
      const middlewares = this.findMiddlewaresByMiddlewareNameList(
        page.middleware,
      )
      return {
        value: middlewares,
        key: page.path,
      }
    })
  }

  findMiddlewaresByMiddlewareNameList(names: string[] = []) {
    return this.middlewareFiles.filter((m) => {
      return names.find(name => m.name === name)
    })
  }
}
