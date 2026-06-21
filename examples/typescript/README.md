# 🧩 Worma TypeScript 旗舰示例

本项目在一个配置中集成了 **6 个 generator**，一次性展示 worma 对所有预设模板的支持，方便你对比不同模板的生成效果。

## 📋 包含的模板

| # | 模板 | 输出目录 | 说明 |
|---|------|----------|------|
| ① | `alova()` | `src/api/alova/` | **函数式模板** — 每个 API 独立导出，支持 tree-shaking，附带 aiDoc 生成 AI Skill 文档 |
| ② | `alovaGlobals()` | `src/api/alova-globals/` | **全局式模板** — 所有 API 注册到 `MyApis` 全局对象，零 import 调用 |
| ③ | `axios()` | `src/api/axios/` | **Axios 模板** — 基于 axios 实例，适合已有 axios 项目的平滑接入 |
| ④ | `fetch()` | `src/api/fetch/` | **Fetch 模板** — 零依赖，基于原生 `fetch` API，极致轻量 |
| ⑤ | `ky()` | `src/api/ky/` | **Ky 模板** — 基于现代化 ky 请求库，自动 JSON 解析 |
| ⑥ | `alova()` + fallback | `src/api/fallback/` | **Input 数组 Fallback** — 演示远程 URL 失败时自动回退到本地文件 |

## 🚀 快速开始

```bash
# 安装依赖（StackBlitz 中全自动）
npm install

# 生成所有 API 客户端代码
npm run gen

# 运行 Demo 查看用法
npm start

# 类型检查
npm run typecheck
```

## 🔥 进阶技巧

### 极简配置：试试 `.wormarc`

将 `.wormarc.example` 重命名为 `.wormarc`，删掉 `worma.config.ts`，再运行 `worma gen` 即可使用纯 JSON 配置。

### aiDoc 插件

本项目的 alova 函数式模板附带了 `aiDoc()` 插件，生成后在 `aidocs/` 目录下会产出 AI Skill 描述文档，可直接作为 AI 编程助手的 Skill 使用。

### Input 数组 Fallback

第 ⑥ 个 generator 的 `input` 是一个数组 `['https://invalid.example.com/...', 'petstore.json']`，worma 会依次尝试直到成功获取，适合多数据源容灾场景。

## 📖 扩展阅读

- [Worma 文档](https://github.com/alovajs/devtools)
- [worma.config 配置详解](./worma.config.ts)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/typescript)
