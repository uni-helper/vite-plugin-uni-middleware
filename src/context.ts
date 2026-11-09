import type { ParseError } from 'jsonc-parser'
import type { Middleware, ResolvedOptions } from './types'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, printParseErrorCode } from 'jsonc-parser'
import { scanMiddlewares } from './scan'

export class Context {
  options: ResolvedOptions
  middlewares: Middleware[] = []
  pagesJson: {
    middleware?: string[]
    pages?: {
      middleware?: string[]
      path: string
    }[]
  } = {}

  constructor(options: ResolvedOptions) {
    this.options = options
  }

  async virtualModule(): Promise<string> {
    this.middlewares = await scanMiddlewares(this.options)

    const pagesJsonRaw = readFileSync(
      resolve(this.options.programRoot, this.options.pagesJsonPath),
      {
        encoding: 'utf-8',
      },
    )
    // pages.json 有语法错误时 jsonc-parser 会返回残缺结果，页面级中间件会静默失效，所以这里直接报错
    const errors: ParseError[] = []
    this.pagesJson = parse(pagesJsonRaw, errors) ?? {}
    if (errors.length > 0) {
      const [first] = errors
      throw new Error(
        `[vite-plugin-uni-middleware] cannot parse ${this.options.pagesJsonPath}: ${printParseErrorCode(first.error)} at offset ${first.offset}`,
      )
    }

    return `${this.middlewareImports.join('\n')}
    export const middlewares = {
      global: [${this.globalMiddlewares.map(v => v.value).join(',')}],
      ${this.pagesMiddlewaresCode.join(',\n')}
    }`
  }

  get pagesMiddlewaresCode(): string[] {
    return this.pagesMiddlewares.map(
      v => `"${v.key}": [${v.value.map(v => v.value).join(',')}]`,
    )
  }

  get middlewareImports(): string[] {
    return this.middlewares.map(v => `import ${v.value} from "${v.path}";`)
  }

  get globalMiddlewares(): Middleware[] {
    return this.findMiddlewaresByMiddlewareNameList(this.pagesJson.middleware)
  }

  get pagesMiddlewares(): { value: Middleware[], key: string }[] {
    if (!this.pagesJson.pages) {
      return []
    }
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

  /** pages.json 里写的顺序就是执行顺序；同一个名字写了两遍也只跑一次 */
  findMiddlewaresByMiddlewareNameList(names: string[] = []): Middleware[] {
    return [...new Set(names)].flatMap((name) => {
      const middleware = this.middlewares.find(m => m.name === name)
      // 写错中间件名会静默不生效，开发期给出提示
      if (!middleware) {
        console.warn(
          `[vite-plugin-uni-middleware] middleware "${name}" not found in ${this.options.middlewareDir}`,
        )
        return []
      }
      return [middleware]
    })
  }
}
