import { readFileSync, writeFileSync } from 'node:fs'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/runtime/index.ts'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  externals: ['vite', 'vue', 'virtual:uni-middleware'],
  failOnWarn: false,
  hooks: {
    'build:done': (ctx) => {
      if (ctx.options.stub) {
        writeFileSync('dist/index.cjs', `process.env.JITI = true;\n${readFileSync('dist/index.cjs', 'utf-8')}`)
        writeFileSync('dist/index.mjs', `process.env.JITI = true;\n${readFileSync('dist/index.mjs', 'utf-8')}`)
      }
    },
  },
})
