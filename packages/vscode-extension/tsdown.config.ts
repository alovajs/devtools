import path from 'node:path'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/extension.ts',
  ],
  format: ['cjs'],
  shims: false,
  clean: false,
  dts: false,
  external: [
    'vscode',
    '@alova/wormhole',
  ],
  outDir: 'out',
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
})
