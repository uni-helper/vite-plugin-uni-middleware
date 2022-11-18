# @uni-helper/vite-plugin-uni-middleware

**WIP** Use route middleware in uni-app with Vite.

English | [简体中文](./README.zhCN.md)

## Installation

```bash
pnpm i -D @uni-helper/vite-plugin-uni-middleware
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import Uni from "@dcloudio/vite-plugin-uni";
import UniMiddleware from "@uni-helper/vite-plugin-uni-middleware";
export default defineConfig({
  plugins: [Uni(), UniMiddleware()],
});
```

Define the middleware in `src/middleware`

```ts
// src/middleware/auth.ts
import { defineMiddleware } from "@uni-helper/vite-plugin-uni-middleware/runtime";
import { useStore } from "../store";

export default defineMiddleware((to, from) => {
  const store = useStore();
  if (!store.isLogin) {
    return "/pages/login/index";
  }
});
```

Add middleware config on global or page in pages.json

```json
// pages.json
{
  ...
  "middleware": ["global"],
  "pages": [{
    "path": "pages/index/index",
    "middleware": ["auth"]
  }]
  ...
}
```

## Configuration

see [types.ts](./src/types.ts)

## Notes

If you used [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages), you will create `pages.d.ts` to define type of `middleware`

```ts
declare module "@uni-helper/vite-plugin-uni-pages" {
  export interface PagesConfig {
    middleware: string[];
  }
}
export {};
```

If you added config for page, just only use route-block

```vue
<route>
{
  "middleware": ["auth"]
}
</route>
```

## How it works

- vite
  1. Scan middlewareDir and pages.json
  2. Provide virtual modules and export middlewares
- runtime
  1. Mixed in page lifecycle onShow
  2. Call global middlewares
  3. Call page middlewares
  4. Intercept navigation based on the returned results

> **Warning**
> Do not use asynchronous middleware as much as possible. Although it will eventually be executed, it cannot intercept navigation
