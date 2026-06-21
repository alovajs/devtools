# 🔬 Worma Benchmark

OpenAPI 代码生成工具性能对比 — 一键运行，直观看到 worma 与业界主流工具的差异。

## 对比工具

| 工具 | npm 包 | 生成内容 |
|------|--------|----------|
| **worma** | `worma` | 类型 + 请求函数 + aiDoc + 多模板 |
| **openapi-typescript** | `openapi-typescript` | 纯类型定义（`.d.ts`） |
| **@hey-api/openapi-ts** | `@hey-api/openapi-ts` | 类型 + 请求函数 |

## 快速开始

```bash
# 在项目根目录安装所有依赖（包含 benchmark & worma）
pnpm install

# 构建 worma（生成 dist/，benchmark 需要它的 CLI）
pnpm build

# 进入 benchmark 运行对比
cd benchmark && pnpm bench
```

## 对比维度

| 维度 | 说明 |
|------|------|
| **生成耗时** | 从解析 OpenAPI 到写入文件的总耗时 |
| **文件数** | 生成的源码文件数量 |
| **总大小** | 生成代码的总体积 |
| **类型生成** | 是否输出 TypeScript 类型定义 |
| **API 调用函数** | 是否生成可直接调用的请求函数 |
| **请求客户端** | 是否集成具体的 HTTP 客户端库 |
| **多模板** | 是否支持多套模板预设 |
| **aiDoc** | 是否生成 AI Skill 文档 |
| **极简配置** | 是否支持 `.wormarc` 纯 JSON 配置 |

## 运行示例输出

```
╔══════════════════════════════════════════════════════════════════╗
║                         📊 性能对比结果                         ║
╠════════════════════╤══════════╤══════════╤══════════╤══════════╣
║ 工具               │ 版本     │ 生成耗时 │ 文件数   │ 总大小   ║
╠════════════════════╪══════════╪══════════╪══════════╪══════════╣
║ openapi-typescript │ 7.x      │ 120ms    │ 1        │ 12 KB    ║
║ @hey-api/openapi-ts│ 0.x      │ 350ms    │ 8        │ 45 KB    ║
║ worma              │ 2.x      │ 280ms    │ 12       │ 58 KB    ║
╚════════════════════╧══════════╧══════════╧══════════╧══════════╝
```

## 文件结构

```
benchmark/
├── bench.ts                  # 主脚本：执行、计时、统计、输出
├── petstore.json             # 测试用 OpenAPI 3.0 规范
├── worma.config.ts           # worma 生成配置
├── openapi-ts.config.ts      # @hey-api/openapi-ts 生成配置
├── package.json              # 所有工具依赖
└── output/                   # （gitignored）生成产物临时目录
    ├── openapi-ts/
    ├── hey-api/
    └── worma/
```


