import { readFileSync } from "fs";
import { resolve } from "path";
import { Plugin, ResolvedConfig } from "vite";
import { virtualModuleId, resolvedVirtualModuleId } from "./constant";
import { parse } from "jsonc-parser";

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
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const pagesJsonRaw = readFileSync(
          resolve(config.root, "src/pages.json"),
          {
            encoding: "utf-8",
          }
        );
        const pagesJson = parse(pagesJsonRaw);
        console.log(pagesJson);
        return `export const middlewares = {
          global: 
        }`;
      }
    },
  };
};

export default VitePluginUniMiddleware;
