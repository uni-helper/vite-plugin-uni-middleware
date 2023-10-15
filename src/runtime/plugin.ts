import type { Plugin } from 'vue'
import { globalMiddlewares, middlewares } from 'virtual:uni-middleware'
import type { MiddlewareReturn, Page } from './types'

function getHistory() {
  const history = getCurrentPages<Page>()
  return {
    history,
    current: history[history.length - 1],
  }
}

function getPageMiddlewares(route: string) {
  return [
    ...globalMiddlewares,
    ...(middlewares[route] || []),
  ]
}

export function createUniMiddleware(): Plugin {
  let to: Page | undefined
  let from: Page | undefined
  return {
    install(app) {
      app.mixin({
        async onShow() {
          // eslint-disable-next-line no-undef
          const { history, current } = getHistory()
          if (!current)
            return
          if (current.route === from?.route)
            return
          to = current
          const middlewares = getPageMiddlewares(to.route)

          function parseMiddleReturn(result: MiddlewareReturn) {
            if (result === undefined)
              return
            if (typeof result === 'boolean' && result)
              return

            if (typeof result === 'boolean' && !result) {
              if (history.length >= 2) {
                return {
                  url: '',
                  method: 'navigateBack',
                  options: {},
                }
              }
              return {
                url: from?.route ?? '/pages/401',
                method: 'reLaunch',
                options: {},
              }
            }
            if (typeof result === 'string') {
              return {
                url: result,
                method: 'redirectTo',
                options: {},
              }
            }

            return {
              method: 'redirectTo',
              options: {},
              ...result,
            }
          }
          for (const middleware of middlewares) {
            try {
              const result = parseMiddleReturn(await middleware(to, from))
              if (!result)
                continue
              const { method, options, url } = result
              // @ts-expect-error ignore
              uni[method]({
                url,
                ...options,
              })
            }
            catch (error) {
              console.error(error)
            }
          }

          from = to
        },
      })
    },
  }
}
