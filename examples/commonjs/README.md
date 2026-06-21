# 🧩 Worma CommonJS 示例

使用 **CommonJS** (`require/module.exports`) 格式的 worma JavaScript 项目，涵盖 4 套预设模板（ky 模板不支持 CJS）。

## 📋 包含的模板

| # | 模板 | 输出目录 | 说明 |
|---|------|----------|------|
| ① | `alova()` | `src/api/alova/` | 函数式模板 — `require/module.exports` 规范 |
| ② | `alovaGlobals()` | `src/api/alova-globals/` | 全局式模板 — 注册到 `MyApis` |
| ③ | `axios()` | `src/api/axios/` | Axios 模板 — CJS 风格的 axios |
| ④ | `fetch()` | `src/api/fetch/` | Fetch 模板 — 无第三方依赖 |

> ⚠️ **注意：** `ky` 为纯 ESM 包，不支持 CommonJS，因此本示例不包含 ky 模板。如果你需要使用 ky，请移步 [ESM 示例](../esm/)。

## 🚀 快速开始

```bash
npm install      # 安装依赖（StackBlitz 中全自动）
npm run gen      # 生成 API 客户端
npm start        # 运行 Demo
```

## 💡 与 ESM 示例的区别

- 使用 `require()` / `module.exports` 而非 `import` / `export`
- 不支持 `ky` 模板（ky 为纯 ESM 包）
- 配置文件中使用 CJS 模块导出

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/commonjs)
