import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          include: ['**/test/cli.spec.ts'],
          pool: 'vmThreads', // https://github.com/vitest-dev/vitest/issues/960
        },
      },
      {
        extends: true,
        test: {
          include: ['**/test/**/*.{test,spec}.{ts,mts,cts,tsx}'],
          exclude: ['**/test/cli.spec.ts'],
        },
      },
    ],
    setupFiles: ['test/setup.ts'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    globals: true,
  },
})
