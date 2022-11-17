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
