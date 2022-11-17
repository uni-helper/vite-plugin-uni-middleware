import { readFileSync } from "fs";
import { parse } from "jsonc-parser";
import { resolve } from "path";
import { ResolvedConfig } from "vite";
import { scanMiddlewares } from "./scan";
import { Middleware, ResolvedOptions } from "./types";

export class Context {
  options: ResolvedOptions;
  config!: ResolvedConfig;
  middlewares: Middleware[] = [];
  pagesJson: {
    middleware?: string[];
    pages?: {
      middleware?: string[];
      path: string;
    }[];
  } = {};
  constructor(options: ResolvedOptions) {
    this.options = options;
  }

  async virtualModule() {
    this.middlewares = await scanMiddlewares(this.options);

    const pagesJsonRaw = readFileSync(
      resolve(this.config.root, "src/pages.json"),
      {
        encoding: "utf-8",
      }
    );
    this.pagesJson = parse(pagesJsonRaw);

    return `${this.middlewareImports.join("\n")}
    export const middlewares = {
      global: [${this.globalMiddlewares.map((v) => v.value).join(",")}],
      ${this.pagesMiddlewaresCode.join(",\n")}
    }`;
  }

  get pagesMiddlewaresCode() {
    return this.pagesMiddlewares.map(
      (v) => `"${v.key}": [${v.value.map((v) => v.value).join(",")}]`
    );
  }

  get middlewareImports() {
    return this.middlewares.map((v) => `import ${v.value} from "${v.path}";`);
  }

  get globalMiddlewares() {
    return this.findMiddlewaresByMiddlewareNameList(this.pagesJson.middleware);
  }

  get pagesMiddlewares() {
    if (!this.pagesJson.pages) {
      return [];
    }
    return this.pagesJson.pages.map((page) => {
      const middlewares = this.findMiddlewaresByMiddlewareNameList(
        page.middleware
      );
      return {
        value: middlewares,
        key: page.path,
      };
    });
  }

  findMiddlewaresByMiddlewareNameList(names: string[] = []) {
    return this.middlewares.filter((m) => {
      return names.find((name) => m.name === name);
    });
  }
}
