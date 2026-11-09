import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: ['test/fixtures'],
}, {
  files: ['pnpm-workspace.yaml'],
  rules: {
    'pnpm/yaml-enforce-settings': 'off',
  },
})
