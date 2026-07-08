// Load the compiled extension and re-export the runtime values the e2e tests
// rely on (`Commands`, `Meta`, `MockWorma`, ...).
//
// We intentionally use `require` here (typed as `any`) instead of a static
// `export * from '../dist/extension/index.js'`, because `build:dts` does not
// always emit `dist/extension/index.d.ts`. The e2e harness only needs the
// runtime values, not their ambient types.
// eslint-disable-next-line ts/no-require-imports
const extension = require('../dist/extension/index.js')

export const activate = extension.activate
export const deactivate = extension.deactivate
export const Commands = extension.Commands
export const Meta = extension.Meta
export const MockWorma = extension.MockWorma
export const Global = extension.Global
export const Log = extension.Log
