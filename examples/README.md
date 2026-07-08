# Worma Examples

在线体验 worma 代码生成能力。每个项目可一键在 [StackBlitz](https://stackblitz.com) 中打开，无需本地安装任何环境。

## 快速体验

直接在浏览器中点击下方按钮，选择一个你感兴趣的项目开始：

[![TypeScript](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/typescript)
&nbsp;
[![ES Module](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/esm)
&nbsp;
[![CommonJS](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/commonjs)

## 项目概览

| 项目                            | 语言       | 模块规范  | 模板数 | 特色亮点                                            |
| ------------------------------- | ---------- | --------- | ------ | --------------------------------------------------- |
| [**typescript**](./typescript/) | TypeScript | ESM       | 6      | 全模板 + aiDoc + input fallback + .wormarc 极简配置 |
| [**esm**](./esm/)               | JavaScript | ES Module | 5      | 全模板、纯 JS、JSDoc 类型提示                       |
| [**commonjs**](./commonjs/)     | JavaScript | CommonJS  | 4      | CJS 规范、ky 以外全模板                             |

## 模板 × 项目类型 对照矩阵

| 模板                      | typescript | esm | commonjs |
| ------------------------- | :--------: | :-: | :------: |
| `alova()` — 函数式        |     ✅     | ✅  |    ✅    |
| `alovaGlobals()` — 全局式 |     ✅     | ✅  |    ✅    |
| `axios()` — Axios         |     ✅     | ✅  |    ✅    |
| `fetch()` — 原生 fetch    |     ✅     | ✅  |    ✅    |
| `ky()` — ky               |     ✅     | ✅  |  ❌ \*   |
| Input 数组 fallback       |     ✅     |  —  |    —     |
| `aiDoc()` 插件            |     ✅     |  —  |    —     |
| `.wormarc` 极简配置       |     ✅     |  —  |    —     |

> \* ky 为纯 ESM 包，不支持 CommonJS 格式。

## 本地运行

每个示例项目都是**自包含**的，依赖已写死直接版本号，可单独克隆安装运行（无需完整 monorepo 环境）。

```bash
# 方式一：从完整 monorepo 进入（可联调本地 wormajs）
git clone https://github.com/alovajs/devtools.git
cd devtools/examples/typescript   # 或 esm / commonjs
npm install
npm run gen

# 方式二：单独克隆某个示例目录（复制/下载该文件夹即可）
cd examples/typescript            # 或 esm / commonjs
npm install
npm run gen

# 查看生成的 API 代码
ls src/api/
```

> 注意：示例内通过 `worma` 命令调用代码生成器，其底层依赖包名为 `wormajs`（`npm install` 会自动安装）。在完整 monorepo 内运行时会使用本地 `packages/worma`，独立克隆时则使用 npm 上发布的 `wormajs`。

## 目录结构

```
examples/
├── README.md                    # ← 你在这里
├── _petstore.json               # 共享 OpenAPI 规范（Petstore 3.0）
│
├── typescript/                  # TypeScript 旗舰项目
│   ├── package.json
│   ├── worma.config.ts          # 6 个 generator，含注释
│   ├── tsconfig.json
│   ├── .wormarc.example         # 极简 JSON 配置示例
│   ├── petstore.json
│   └── src/demo.ts
│
├── esm/                         # ES Module 项目
│   ├── package.json
│   ├── worma.config.js          # 5 个 generator
│   ├── petstore.json
│   └── src/demo.js
│
└── commonjs/                    # CommonJS 项目
    ├── package.json
    ├── worma.config.js          # 4 个 generator
    ├── petstore.json
    └── src/demo.js
```

## StackBlitz 使用提示

1. 点击上方按钮打开项目后，等待依赖自动安装
2. 打开终端，运行 `npm run gen` 生成 API 客户端代码
3. 在 `src/api/` 下查看各模板的生成结果
4. 编辑 `worma.config.ts` 实时试验不同配置
