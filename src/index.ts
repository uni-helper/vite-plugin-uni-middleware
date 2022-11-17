import { readFileSync } from "fs";
import { resolve } from "path";
import { Plugin, ResolvedConfig } from "vite";
import { virtualModuleId, resolvedVirtualModuleId } from "./constant";
import { parse } from "jsonc-parser";
import { scanMiddlewares } from "./scan";

export const VitePluginUniMiddleware = (): Plugin => {
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-uni-middleware",
    configResolved(_config) {
      config = _config;
    },
    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const middlewares = await scanMiddlewares();
        const pagesJsonRaw = readFileSync(
          resolve(config.root, "src/pages.json"),
          {
            encoding: "utf-8",
          }
        );
        const pagesJson = parse(pagesJsonRaw);

        const imports = middlewares.map(
          (v) => `import ${v.pascalName} from "${v.path}";`
        );
        const global = pagesJson.middleware
          ? pagesJson.middleware
              .map((p: string) => {
                const middleware = middlewares.find((v) => v.camelName === p);
                if (middleware) {
                  return middleware.pascalName;
                }
                return "";
              })
              .filter((v: string) => v)
          : [];
        const pages = pagesJson.pages
          ? pagesJson.pages.map((page: any) => {
              const pageMiddlewares = page.middleware
                ? page.middleware
                    .map((p: string) => {
                      const middleware = middlewares.find(
                        (v) => v.camelName === p
                      );
                      if (middleware) {
                        return middleware.pascalName;
                      }
                      return "";
                    })
                    .filter((v: string) => v)
                : [];
              return `"${page.path}": [${pageMiddlewares.join(",")}]`;
            })
          : [];
        const code = `${imports.join("\n")}
        export const middlewares = {
          global: [${global.join(",")}],
          ${pages.join(",")}
        }`;
        return code;
      }
    },
  };
};

export default VitePluginUniMiddleware;
