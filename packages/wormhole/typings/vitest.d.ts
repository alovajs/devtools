import type { Assertion } from 'vitest';

interface CustomMatchers<T = unknown> extends Assertion<T> {
  toBeDeepEqual<R>(expected: R): void;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
