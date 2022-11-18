import { resolve } from "path";
import { ModuleNode, normalizePath, Plugin, ResolvedConfig } from "vite";
import { virtualModuleId, resolvedVirtualModuleId } from "./constant";
import { Context } from "./context";
import { ResolvedOptions, UserOptions } from "./types";

const resolveOptions = (userOptions: UserOptions): ResolvedOptions => {
  return {
    middlewareDir: "src/middleware",
    ...userOptions,
  };
};

export const VitePluginUniMiddleware = (
  userOptions: UserOptions = {}
): Plugin => {
  const options = resolveOptions(userOptions);
  const ctx = new Context(options);
  return {
    name: "vite-plugin-uni-middleware",
    configureServer({ watcher, moduleGraph, ws }) {
      const pagesJsonPath = normalizePath(
        resolve(ctx.config.root, "src/pages.json")
      );
      watcher.add(pagesJsonPath);
      const reloadModule = (module: ModuleNode | undefined, path = "*") => {
        if (module) {
          moduleGraph.invalidateModule(module);
          if (ws) {
            ws.send({
              path,
              type: "full-reload",
            });
          }
        }
      };
      const updateVirtualModule = () => {
        const module = moduleGraph.getModuleById(resolvedVirtualModuleId);
        reloadModule(module);
      };

      watcher.on("change", async (path) => {
        path = normalizePath(path)
        if (pagesJsonPath === path || path.includes(options.middlewareDir)) {
          updateVirtualModule();
        }
      });
      watcher.on("add", async (path) => {
        path = normalizePath(path)
        if (path.includes(options.middlewareDir)) {
          updateVirtualModule();
        }
      });
      watcher.on("unlink", async (path) => {
        path = normalizePath(path)
        if (path.includes(options.middlewareDir)) {
          updateVirtualModule();
        }
      });
    },
    configResolved(_config) {
      ctx.config = _config;
    },
    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return ctx.virtualModule();
      }
    },
  };
};

export default VitePluginUniMiddleware;
