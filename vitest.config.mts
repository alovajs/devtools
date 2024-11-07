import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['packages/wormhole/src/**/*'],
      reporter: ['lcov', 'html']
    }
  }
});
