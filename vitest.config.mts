import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*'],
    coverage: {
      include: ['packages/wormhole/src/**/*'],
      reporter: ['lcov', 'html'],
      exclude: ['**/e2e*/**'],
    },
    exclude: ['**/e2e*/**'],
  },
})
