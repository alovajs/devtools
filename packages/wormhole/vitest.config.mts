import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [{
      test: {
        include: ['**/test/cli.spec.ts'],
        pool: 'vmThreads', // https://github.com/vitest-dev/vitest/issues/960
      },
    }],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    globals: true,
  },
})
