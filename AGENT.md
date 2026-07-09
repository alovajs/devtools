# Project Rules

## Documentation First

When developing new features or modifying existing features, always update the following documentation files **before** making code changes:

1. `worma@2新特性提案.md` — Feature proposal document
2. `worma@2规格说明.md` — Specification document, you will mark to `finish` after the feature is implemented

This ensures documentation stays in sync with the implementation and serves as the source of truth for design decisions.

## CI / pnpm-lockfile Fragility (e2e)

The e2e tests (`packages/vscode-extension/e2e/index.ts`) copy `examples/{commonjs,esm,typescript}`
into `e2e-fixtures-temp/*` at runtime, then run a nested `pnpm i`. Because
`e2e-fixtures-temp/*` is a workspace member (`pnpm-workspace.yaml`), that nested install
reuses the root `pnpm-lock.yaml` with `frozen-lockfile` (CI default) and checks every
workspace member against it.

`examples/*` may use explicit versions (e.g. `axios: ^1.17.0`), but the committed
`pnpm-lock.yaml` records these fixtures with `catalog:` specifiers. Any drift between the
two triggers `ERR_PNPM_OUTDATED_LOCKFILE` in CI.

**Rules to avoid breaking e2e CI:**

- If you change dependency versions in `examples/{commonjs,esm,typescript}/package.json`,
  you MUST regenerate the lockfile so `e2e-fixtures-temp/*` entries match (generate the
  fixtures locally, run `pnpm install`, commit `pnpm-lock.yaml`).
- If you add/change an action's `fixtures.js` to declare a new example fixture not yet in
  the lockfile, regenerate and commit `pnpm-lock.yaml` for it.
- Do NOT commit `e2e-fixtures-temp/` itself — it is gitignored and generated at runtime.

**Root cause / durable fix (not yet applied):** make the e2e harness write fixture
dependencies as `catalog:` so they decouple from `examples/*` explicit versions and the
lockfile never needs resyncing.
