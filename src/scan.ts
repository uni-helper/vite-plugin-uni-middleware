import fg from "fast-glob";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { pascalCase, splitByCase, camelCase } from "scule";
import { normalizePath } from "vite";
import { ResolvedOptions, Middleware } from "./types";

export const scanMiddlewares = async (options: ResolvedOptions) => {
  const middlewares: Middleware[] = [];
  const files = await fg("**/*.(js|ts)", {
    ignore: ["node_modules", ".git", "**/__*__/*"],
    onlyFiles: true,
    cwd: resolve(process.cwd(), options.middlewareDir),
  });
  files.sort();
  const cwd = process.cwd();
  const dir = resolve(cwd, options.middlewareDir);
  for (let file of files) {
    const filePath = join(dir, file);
    const dirNameParts = splitByCase(
      normalizePath(relative(dir, dirname(filePath)))
    );
    let fileName = basename(filePath, extname(filePath));
    if (fileName.toLowerCase() === "index") {
      fileName = basename(dirname(filePath));
    }
    const fileNameParts = splitByCase(fileName);
    const middlewareNameParts: string[] = [];
    while (
      dirNameParts.length &&
      (dirNameParts[0] || "").toLowerCase() !==
        (fileNameParts[0] || "").toLowerCase()
    ) {
      middlewareNameParts.push(dirNameParts.shift()!);
    }
    const middlewareName =
      pascalCase(middlewareNameParts) + pascalCase(fileNameParts);

    const value = pascalCase(middlewareName).replace(/["']/g, "");
    const name = camelCase(value);

    if (!middlewares.find((m) => m.name === name)) {
      middlewares.push({
        name,
        value,
        path: normalizePath(filePath),
      });
    }
  }
  return middlewares;
};
