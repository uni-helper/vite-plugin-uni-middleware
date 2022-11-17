import fg from "fast-glob";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { pascalCase, splitByCase, camelCase } from "scule";
import { normalizePath } from "vite";

export const scanMiddlewares = async () => {
  let dir = "src/middleware";
  const middlewares: { pascalName: string; camelName: string; path: string }[] =
    [];
  const files = await fg("**/*.(js|ts)", {
    ignore: ["node_modules", ".git", "**/__*__/*"],
    onlyFiles: true,
    cwd: resolve(process.cwd(), dir),
  });
  files.sort();
  const cwd = process.cwd();
  dir = resolve(cwd, dir);
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
    const pascalName = pascalCase(middlewareName).replace(/["']/g, "");
    const camelName = camelCase(pascalName);
    if (!middlewares.find((m) => m.pascalName === pascalName)) {
      middlewares.push({
        pascalName,
        camelName,
        path: normalizePath(filePath),
      });
    }
  }
  return middlewares;
};
