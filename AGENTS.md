# vite-plugin-uni-middleware

在 Vite 驱动的 uni-app 中提供路由中间件：构建期扫描 `src/middleware` 生成虚拟模块 `virtual:uni-middleware`，运行时用四个导航 API 的拦截器 + 页面 `onShow` 兜底实现拦截。无 CLAUDE.md。

## Project

- TypeScript + ESM only(`"type": "module"`)，tsconfig `strict: true`；产物只有 ESM(`dist/index.mjs` + `index.d.mts`，runtime 同构)，发布内容为 `dist` 加根级 `client.d.ts`(经 `exports["./client"]` 提供)。CJS 使用方无法 `require` 本包。
- 构建：tsdown(入口 `src/index.ts` 和 `src/runtime/index.ts`)。产物里没有 `virtual:uni-middleware`：运行时不再 import 它，中间件表由使用方的 `main.ts` 传入。
- 类型产物里 `vue` 必须保持 external(`deps.neverBundle`)：内联 vue 的声明会在 `dist/runtime/index.d.mts` 里造出第二份 `App` / `ObjectPlugin`，使用方 `app.use()` 收不了。`vue` 因此是 peer 依赖。
- 包管理器：pnpm 12.18.0(`packageManager`，Node 26 见 `.node-version` / `devEngines`)，依赖版本集中在 `pnpm-workspace.yaml` 的 `catalog:`，package.json 一律写 `"catalog:"`。workspace 只有 `playground`。
- 依赖：运行时依赖 tinyglobby、jsonc-parser、scule；peer 依赖 `vue >= 3.0.0` 和 `vite ^5.0.0`。开发用 vite 5 + TS 6 + vue 3.4(catalog 与 playground 共用，勿引入第二份 vue，否则两份 runtime-core 的 `App` 类型不兼容)。
- 测试：vitest 3(`pnpm test` = `vitest run`)，用例在 `test/`，没有配置文件，直接 import `src/`。
- CI：`.github/workflows/ci.yml`，Ubuntu / macOS / Windows × Node 22 / 24 / 26，跑 build、lint、test、typecheck 和 playground 的 H5 / 微信小程序构建。发布先在本地 `pnpm release`(bumpp) 打 tag，`.github/workflows/release.yml` 处理 `v*` tag：`changelogithub` 发 release，`pnpm publish` 发 npm。
- Lint：`@antfu/eslint-config`(`pnpm lint` / `lint:fix`)，单引号、无分号，`test/fixtures` 整个目录被忽略(里面有故意写坏的 JSON)。

## Commands

```bash
pnpm install                  # 安装依赖
pnpm dev                      # tsdown watch 构建插件，playground 依赖 dist
pnpm build                    # 一次性构建到 dist/
pnpm test                     # vitest run，全部用例
pnpm vitest run test/guard.test.ts   # 只跑一个文件
pnpm lint                     # eslint 检查
pnpm lint:fix                 # eslint 自动修复
pnpm typecheck                # tsc --noEmit
pnpm dev:play:h5              # 跑 playground 的 dev:h5(需先 pnpm dev)
pnpm build:play:h5            # 构建 playground H5
pnpm build:play:mp-weixin     # 构建 playground 微信小程序
pnpm release                  # 维护者发布：bumpp
```

## Architecture

| 模块 | 职责 |
| --- | --- |
| `src/index.ts` | 插件入口：解析选项、注册虚拟模块、监听 pages.json 和 middlewareDir 触发整页刷新 |
| `src/context.ts` | 组装虚拟模块代码：重扫中间件 + 解析 pages.json，拼 import 与 `middlewares` 映射，顺序按 `middleware` 数组；未知中间件名 warn；pages.json 解析失败直接抛错(否则页面级中间件会静默失效) |
| `src/scan.ts` | 用 tinyglobby 扫描 `middlewareDir` 下 `**/*.(js\|ts)`，推导中间件名；重名时 warn 并保留先扫到的 |
| `src/types.ts` | `Options`(middlewareDir / pagesJsonPath / programRoot)与 `Middleware` 元数据 |
| `src/runtime/guard.ts` | 守卫实现，不 import 虚拟模块：拦截器注册、同步/异步中间件执行、`onShow` 兜底、防重入与防循环；依赖 `GuardUni` / `GuardPage` 注入 |
| `src/runtime/index.ts` | 把调用方传入的中间件表和真实 `uni` / `getCurrentPages` 注入 `createGuard`，导出 `createNavigationGuardPlugin` 和 `defineMiddleware` |
| `src/runtime/types.ts` | `RouteLocation`、`MiddlewareReturn`、`Middleware` 等公开类型 |
| `client.d.ts` | `virtual:uni-middleware` 的模块声明，类型从 `@uni-helper/vite-plugin-uni-middleware/runtime` 取 |
| `test/context.test.ts` | 虚拟模块代码生成：全局与页面中间件、`middleware` 数组顺序、pages.json 解析失败 |
| `test/guard.test.ts` | 手写假 uni 运行时驱动守卫，断言真正发生了哪些导航 |
| `test/runtime.test.ts` | `createNavigationGuardPlugin` 漏传中间件表时报错，不静默跳过中间件 |

关键行为：

- **拦截器优先**：`navigateTo`、`redirectTo`、`reLaunch`、`switchTab` 四个 API 注册 `invoke`。同步中间件放行时返回原参数，平台照常导航；同步结果不放行时返回 `false` 取消导航，再由守卫自己跳转或什么都不做。异步中间件拿不到同步结论，守卫一律先返回 `false` 取消，等 Promise 结束后再 `replay` 原调用或跳转。
- **`onShow` 兜底**：TabBar 点击(微信小程序点击 TabBar 不触发 `uni.switchTab`)、冷启动、H5 直接改地址不经过上面四个 API，页面显示后由 `onShow` 执行中间件。这条路径上页面已经渲染，只能事后跳走。
- **防重入**：守卫自己发起的导航会再次进入拦截器，`bypass` 标志放行；`apply` / `replay` / `navigateBack` 都必须包在 `bypass` 里。
- **不重复执行**：`allowedRoute` 记录拦截器已放行但还没显示的页面，`onShow` 消费后跳过；平台导航失败时清掉这个标记(通过包裹 `args.fail`)，否则下一次 TabBar 进入同一页面会漏检。`shownRoute` 记录最近显示的页面，同一页面再次 `onShow`(从后台切回)跳过，守卫从页面跳走时清空。
- **防循环**：`onShow` 路径记录已经离开的页面，发现要跳回其中某个就停止并 `reportError`。
- **失败策略**：中间件抛错时 `reportError` 后继续下一个，不把用户卡住；`pages.json` 解析失败则构建期抛错。`false` 在页面栈只有一页时无法回退，只报错。
- **回调语义**：改道时把调用方的 `success` / `fail` / `complete` 传给那次跳转；直接取消(`false`)时三个回调都不触发，这是 uni-app 拦截器的行为，README 已写明。
- **中间件名推导**(scan.ts)：目录段逐段与文件名段比对，相同的段及之后丢弃，剩余目录段 + 文件名段拼成 PascalCase 的 `value`，camelCase 的 `name`；文件名为 `index` 时取父目录名。
- **根目录**：`programRoot` 同时用于扫描 `middlewareDir` 和读取 `pagesJsonPath`(默认 `process.cwd()`)，两处必须一致，否则找不到 pages.json 或中间件。
- **虚拟模块**：`middlewares.global` 来自 pages.json 顶层 `middleware` 字段，页面级来自 `pages[].middleware`，key 是页面 `path`。数组里的顺序就是执行顺序，全局排在最前面。只有 `configureServer` 里监听变更，生产构建不监听。
- **中间件表必须由 `main.ts` 传给 `createNavigationGuardPlugin(middlewares)`**：小程序构建里 uni-app 的 `manualChunks` 把 `node_modules` 打包成 `common/vendor`、每个项目文件单独成 chunk，运行时(在 `node_modules`)一旦自己 import 虚拟模块，`common/vendor` → 中间件 chunk → `common/vendor` 就成环，构建报 `Circular chunk`，小程序上 `middleware/*.js` 在 `common/vendor` 定义导出之前就调用 `defineMiddleware`，直接抛错。不要在 `src/runtime/index.ts` 里 import `virtual:uni-middleware`。
- **类型解析**：`client.d.ts` 用包名 import runtime 类型，`tsconfig.json` 的 `paths` 把它指到 `src/runtime/index.ts`，所以仓库内 typecheck 不需要先构建 dist。

## Conventions

- 代码风格：`@antfu/eslint-config`——单引号、无分号、import 自动排序；写完跑 `pnpm lint:fix`。
- 注释与文档语言：README 为简体中文，源码注释只写意图性说明，用中文；运行时错误和警告信息用英文。
- 测试：在行为边界断言「发生了哪些导航」，不要断言内部状态；假 `uni` 的拦截器语义必须和 `@dcloudio/uni-h5` / `uni-mp-weixin` 的 `queue` 一致(`invoke` 返回 `false` 才取消)。`test/fixtures` 只给扫描用。
- 提交信息遵循 Conventional Commits(`feat:` / `fix:` / `docs:`，见 git log)。
