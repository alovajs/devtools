import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['packages/*/vitest.config.ts', 'packages/*/vitest.config.mts']);
