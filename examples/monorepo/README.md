# 🧩 Worma ESM Monorepo Example

This example splits each worma preset template into its own sub-package, simulating a **multi-package monorepo** scenario to make it easier to test how each template behaves when generated as a standalone project.

Each sub-package contains **only one generator**, and they are all managed together through a pnpm workspace.

## 📦 Sub-packages Overview

| Sub-package | Directory             | Template  | Dependencies |
| ----------- | --------------------- | --------- | ------------ |
| `alova-app` | `packages/alova-app/` | `alova()` | `alova`      |
| `axios-app` | `packages/axios-app/` | `axios()` | `axios`      |
| `fetch-app` | `packages/fetch-app/` | `fetch()` | Zero deps    |
| `ky-app`    | `packages/ky-app/`    | `ky()`    | `ky`         |

## 🚀 Quick Start

```bash
# 1. Install dependencies at the monorepo root
pnpm install

# 2. Generate API clients for all sub-packages at once
pnpm gen:all

# 3. Run each sub-package separately
pnpm start:alova
pnpm start:axios
pnpm start:fetch
pnpm start:ky
```

Or enter a single sub-package to operate independently:

```bash
cd packages/alova-app
pnpm install
pnpm gen       # Equivalent to worma gen -f
pnpm start     # Equivalent to node src/main.js
```

## 📝 Notes

- The shared `petstore.json` is located at the monorepo root; each sub-package references it via the relative path `../../petstore.json`
- Each sub-package is an independent ESM project (`"type": "module"`)
- Generated code is output to each sub-package's `src/api/` directory (ignored in `.gitignore`)
