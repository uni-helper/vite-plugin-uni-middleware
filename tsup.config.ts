import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/runtime/index.ts"],
  format: ["cjs", "esm"],
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  external: ["virtual:uni-middleware", "vite"],
});
