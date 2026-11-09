# 参与贡献

感谢你愿意为这个项目贡献时间！本文档介绍项目结构、本地开发流程和提交规范。

## 前置条件

- [Node.js](https://nodejs.org/) 26(见仓库根目录 `.node-version` 与 `package.json` 的 `devEngines`)
- [pnpm](https://pnpm.io/) 12.18.0(见根 `package.json` 的 `packageManager` 字段，可用 [corepack](https://nodejs.org/api/corepack.html) 启用)

## 仓库结构

```text
.
├── src/                  # 插件源码
│   ├── index.ts          # Vite 插件入口：选项解析、虚拟模块、HMR
│   ├── context.ts        # 扫描结果与 pages.json 组装成虚拟模块代码
│   ├── scan.ts           # 扫描 middlewareDir，推导中间件名
│   ├── types.ts          # 插件选项与中间件元数据类型
│   ├── constant.ts       # 虚拟模块 ID
│   └── runtime/          # 运行时
│       ├── index.ts      # createNavigationGuardPlugin、defineMiddleware
│       ├── guard.ts      # 拦截器与 onShow 兜底的具体逻辑，不依赖虚拟模块
│       └── types.ts      # RouteLocation、Middleware 等公开类型
├── test/                 # vitest 用例
│   ├── guard.test.ts     # 运行时守卫，用手写的假 uni 运行时驱动
│   ├── runtime.test.ts   # createNavigationGuardPlugin 的参数校验
│   ├── scan.test.ts      # 中间件名推导与重名警告
│   ├── context.test.ts   # 虚拟模块生成、middleware 顺序、pages.json 解析失败
│   └── fixtures/         # 扫描用的小目录，不会被 import
├── playground/           # 示例 uni-app 应用(workspace 成员，用于本地调试)
├── .github/workflows/    # CI
├── client.d.ts           # virtual:uni-middleware 的类型声明
└── tsdown.config.ts      # tsdown 构建配置(ESM + dts)
```

## 本地开发

```bash
# 安装依赖(在仓库根目录执行)
pnpm install

# 代码检查与自动修复
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck

# 单元测试(只跑一次)
pnpm test

# 以 watch 模式构建插件(开发时保持运行)
pnpm dev

# 另开一个终端，启动 playground 的 H5 示例
pnpm dev:play:h5
# 或构建 playground H5 验证完整产物
pnpm build:play:h5
```

依赖版本统一在 `pnpm-workspace.yaml` 的 `catalog:` 中维护，单个 package 一律写 `"catalog:"`，不要在 `package.json` 里写死版本。

playground 通过 `workspace:*` 引用本插件，并使用 `@uni-helper/vite-plugin-uni-pages` 生成路由；修改 `src/` 后等 watch 构建产出，playground 的 dev server 会热更新。也可以直接在 playground 目录使用它自己的脚本(如 `pnpm -C playground run dev:mp-weixin`)调试小程序端。

## 测试与检查

```bash
pnpm test                            # 全部用例
pnpm vitest run test/guard.test.ts   # 只跑一个文件
pnpm vitest run -t "redirect"        # 按用例名筛选
```

提交前请执行 `pnpm lint`、`pnpm typecheck`、`pnpm test` 和 `pnpm build`，确认全部通过。

### 测试说明

`test/guard.test.ts` 里的 `uni` 是自己写的假运行时，行为照 `@dcloudio/uni-h5` 和 `@dcloudio/uni-mp-weixin` 里的 `queue` 实现：`invoke` 返回 `false` 取消导航，返回其它值继续用原参数调用。断言看的是「真正发生了哪些导航」，不依赖 uni-app 的运行时。

`test/fixtures` 下的文件只给扫描逻辑用，测试不会 import 它们。

## 代码架构

1. `VitePluginUniMiddleware` 解析选项，创建 `Context`。
2. 虚拟模块被请求时，`Context` 扫描中间件、读取 pages.json，拼出 `middlewares` 映射。
3. `main.ts` 把这份映射传给 `createNavigationGuardPlugin`，守卫给四个导航 API 加拦截器，并混入页面 `onShow`。
4. 守卫按「全局 → 页面」执行中间件，第一个不放行的结果决定是改道、取消还是继续。

## 提交规范

1. Fork 仓库并创建分支，分支名使用 `feat/xxx`、`fix/xxx`、`docs/xxx` 风格。
2. 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，如 `feat: support async middleware`、`docs: add config table`。

## Pull Request 指南

- 一个 PR 只解决一个问题，保持改动聚焦；顺手发现的无关问题请另开 PR。
- 涉及用法变化时同步更新 README、`test/` 和 playground 示例。
- CI 在 Ubuntu、macOS、Windows 上跑 Node 22 / 24 / 26，依次执行 build、lint、test、typecheck 和 playground 的 H5 / 微信小程序构建，全部通过再合并。
- 较大的改动建议先到 [Issues](https://github.com/uni-helper/vite-plugin-uni-middleware/issues) 讨论再动手。
- 推送分支并打开 Pull Request，说明改动动机。

如有使用问题，欢迎到 [Issues](https://github.com/uni-helper/vite-plugin-uni-middleware/issues) 提问。
