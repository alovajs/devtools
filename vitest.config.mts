import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*'],
    coverage: {
      include: ['packages/worma/src/**/*'],
      reporter: ['lcov', 'html'],
    },
  },
})
