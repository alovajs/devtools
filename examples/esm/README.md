# 🧩 Worma ESM 示例

使用 **ES Module** (`"type": "module"`) 格式的 worma JavaScript 项目，涵盖全部 5 套预设模板。

## 📋 包含的模板

| #   | 模板             | 输出目录                 | 说明                                  |
| --- | ---------------- | ------------------------ | ------------------------------------- |
| ①   | `alova()`        | `src/api/alova/`         | 函数式模板 — 每个 API 独立 `export`   |
| ②   | `alovaGlobals()` | `src/api/alova-globals/` | 全局式模板 — API 挂载到 `MyApis` 对象 |
| ③   | `axios()`        | `src/api/axios/`         | Axios 模板 — 基于 axios 实例          |
| ④   | `fetch()`        | `src/api/fetch/`         | Fetch 模板 — 零依赖，原生 fetch       |
| ⑤   | `ky()`           | `src/api/ky/`            | Ky 模板 — 现代化 ky 请求库            |

## 🚀 快速开始

```bash
npm install      # 安装依赖（StackBlitz 中全自动）
npm run gen      # 生成 API 客户端
npm start        # 运行 Demo
```

## 💡 与 TypeScript 示例的区别

ESM 项目使用 `.js` 扩展名，不需要 `tsconfig.json`，适合纯 JavaScript 项目。生成代码同样支持 JSDoc 注释，在 VSCode 中可获得类型提示。

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/esm)
