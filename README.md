# @uni-helper/vite-plugin-uni-middleware

**WIP** 在 Vite 驱动的 uni-app 中使用路由中间件

## 安装

```bash
pnpm i -D @uni-helper/vite-plugin-uni-middleware
```

## 使用

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'
import UniMiddleware from '@uni-helper/vite-plugin-uni-middleware'

export default defineConfig({
  plugins: [Uni(), UniMiddleware()],
})
```

在 `src/middleware` 中定义中间件

```ts
// src/middleware/auth.ts
import { defineMiddleware } from '@uni-helper/vite-plugin-uni-middleware/runtime'
import { useStore } from '../store'

export default defineMiddleware((to, from) => {
  const store = useStore()
  if (!store.isLogin)
    return '/pages/login/index'
})
```

在 pages.json 中添加全局或页面的中间件配置

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

## 配置

see [types.ts](./src/types.ts)
