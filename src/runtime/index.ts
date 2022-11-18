import type { Plugin } from "vue";
import { middlewares } from "virtual:uni-middleware";
import { Page } from "./types";
import { Middleware } from "./types";
export * from "./types";

export function createNavigationGuardPlugin(): Plugin {
  let from: Page;
  let to: Page;
  return {
    install(app) {
      app.mixin({
        async onShow() {
          const pages = getCurrentPages<Page>();
          const page = pages[pages.length - 1];
          if (!page) return;
          if (page.route === from?.route) return;
          to = page;
          try {
            const pageMiddlewares = middlewares.global.concat(
              middlewares[to.route] ?? []
            );

            for (let middleware of pageMiddlewares) {
              const result = await middleware(to, from);
              if (result === undefined) {
                continue;
              } else if (typeof result === "boolean" && result) {
                continue;
              } else if (typeof result === "boolean" && !result) {
                if (pages.length >= 2) {
                  uni.navigateBack();
                } else {
                  uni.reLaunch({
                    url: from.route,
                  });
                }
              } else if (typeof result === "string") {
                uni.redirectTo({
                  url: result,
                });
              } else {
                const { method, options, url } = result;
                uni[method]({
                  url,
                  ...options,
                });
              }
            }
          } catch (error) {}
          from = to;
        },
      });
    },
  };
}

export function defineMiddleware(middleware: Middleware) {
  return middleware;
}
