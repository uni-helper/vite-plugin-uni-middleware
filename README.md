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

## 待定

- 使用 onShow 生命周期函数，目前使用的方式，即先跳转到页面，然后再执行中间件
  - 优点
    - 支持 TabBar 点击切换
  - 缺点
    - 无法阻塞页面执行生命周期，渲染；可以提供两个生命周期函数，分别在中间件执行前和执行后执行，让用户自主适配，但是这样脱离社区标准了。

- 使用 uni.addInterceptor，即先执行中间件，然后再跳转页面
  - 优点
    - 运作方式符合正常思维和社区标准
  - 缺点
    - TabBar 点击切换无法拦截，但是调用 switchTab 反而又可以，需要用户自己去适配，容易逻辑混乱

- 混合方式，即使用 uni.addInterceptor 拦截普通页面，使用 onShow 拦截 TabBar 页面，并放弃拦截 switchTab
  - 优点
    - 支持 TabBar 点击切换
  - 缺点
    - TabBar 页面和普通页面的运作行为不一致，增加用户心智负担
