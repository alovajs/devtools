# Worma Examples

Try out worma's code generation online. Each project can be opened in [StackBlitz](https://stackblitz.com) with one click, no local setup required.

## Quick Start

Click the button below in your browser and pick a project you're interested in to get started:

[![TypeScript](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/typescript)
&nbsp;
[![ES Module](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/esm)
&nbsp;
[![CommonJS](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/commonjs)

## Project Overview

| Project                         | Language   | Module system | Templates | Highlights                                                       |
| ------------------------------- | ---------- | ------------- | --------- | ---------------------------------------------------------------- |
| [**typescript**](./typescript/) | TypeScript | ESM           | 6         | All templates + aiDoc + input fallback + minimal .wormarc config |
| [**esm**](./esm/)               | JavaScript | ES Module     | 5         | All templates, pure JS, JSDoc type hints                         |
| [**commonjs**](./commonjs/)     | JavaScript | CommonJS      | 4         | CJS format, all templates except ky                              |

## Template × Project type matrix

| Template                  | typescript | esm | commonjs |
| ------------------------- | :--------: | :-: | :------: |
| `alova()` — functional    |     ✅     | ✅  |    ✅    |
| `alovaGlobals()` — global |     ✅     | ✅  |    ✅    |
| `axios()` — Axios         |     ✅     | ✅  |    ✅    |
| `fetch()` — native fetch  |     ✅     | ✅  |    ✅    |
| `ky()` — ky               |     ✅     | ✅  |  ❌ \*   |
| Input array fallback      |     ✅     |  —  |    —     |
| `aiDoc()` plugin          |     ✅     |  —  |    —     |
| `.wormarc` minimal config |     ✅     |  —  |    —     |

> \* ky is a pure ESM package and does not support the CommonJS format.

## Run locally

Each example project is **self-contained**, with pinned dependency versions, so it can be cloned and run on its own (no full monorepo environment needed).

```bash
# Option 1: enter from the full monorepo (enables local wormajs linkage)
git clone https://github.com/alovajs/devtools.git
cd devtools/examples/typescript   # or esm / commonjs
npm install
npm run gen

# Option 2: clone a single example directory (just copy/download that folder)
cd examples/typescript            # or esm / commonjs
npm install
npm run gen

# View the generated API code
ls src/api/
```

> Note: the examples invoke the code generator via the `worma` command; its underlying dependency package is `wormajs` (installed automatically by `npm install`). Running inside the full monorepo uses the local `packages/worma`, while a standalone clone uses the published `wormajs` from npm.

## Directory structure

```
examples/
├── README.md                    # ← you are here
├── _petstore.json               # shared OpenAPI spec (Petstore 3.0)
│
├── typescript/                  # TypeScript flagship project
│   ├── package.json
│   ├── worma.config.ts          # 6 generators, with comments
│   ├── tsconfig.json
│   ├── .wormarc.example         # minimal JSON config example
│   ├── petstore.json
│   └── src/demo.ts
│
├── esm/                         # ES Module project
│   ├── package.json
│   ├── worma.config.js          # 5 generators
│   ├── petstore.json
│   └── src/demo.js
│
└── commonjs/                    # CommonJS project
    ├── package.json
    ├── worma.config.js          # 4 generators
    ├── petstore.json
    └── src/demo.js
```

## StackBlitz tips

1. After opening the project via the button above, wait for dependencies to install automatically
2. Open a terminal and run `npm run gen` to generate the API client code
3. Check the generated results of each template under `src/api/`
4. Edit `worma.config.ts` to experiment with different configs live
