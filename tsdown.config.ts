import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/runtime/index.ts'],
  format: 'esm',
  dts: true,
  deps: {
    // vue 只在类型里出现。把它的声明内联进 dist 会造出第二份 App / ObjectPlugin，
    // 使用方的 app.use() 收不了这个类型
    neverBundle: ['vue'],
  },
})
