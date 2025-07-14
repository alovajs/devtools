import path from 'node:path'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/extension.ts',
  ],
  format: ['cjs'],
  shims: false,
  dts: false,
  external: [
    'vscode',
    '@alova/wormhole',
  ],
  outDir: 'out',
  alias: {
    '@': path.resolve(__dirname, './src'),
    '~': path.resolve(__dirname, './typings'),
    '#': path.resolve(__dirname, '.'),
  },
})
