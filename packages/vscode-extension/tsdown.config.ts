import path from 'node:path'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/extension.ts',
    'src/handlers/index.ts',
  ],
  format: ['cjs'],
  shims: false,
  dts: true,
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
