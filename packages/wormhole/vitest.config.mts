import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolMatchGlobs: [['**/test/cli.spec.ts', 'vmThreads']], // https://github.com/vitest-dev/vitest/issues/960
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    globals: true,
  },
})
