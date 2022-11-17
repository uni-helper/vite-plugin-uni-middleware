import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/runtime/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["virtual:uni-middleware"],
});
