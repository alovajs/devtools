# 🧩 Worma ESM Monorepo 示例

将 worma 的每个预设模板拆分为独立的子包，模拟**多包 monorepo** 场景，便于测试各模板生成独立项目时的效果。

每个子包**只设置一个 generator**，通过 pnpm workspace 统一管理。

## 📦 子包一览

| 子包        | 目录                  | 模板      | 依赖    |
| ----------- | --------------------- | --------- | ------- |
| `alova-app` | `packages/alova-app/` | `alova()` | `alova` |
| `axios-app` | `packages/axios-app/` | `axios()` | `axios` |
| `fetch-app` | `packages/fetch-app/` | `fetch()` | 零依赖  |
| `ky-app`    | `packages/ky-app/`    | `ky()`    | `ky`    |

## 🚀 快速开始

```bash
# 1. 在 monorepo 根目录安装依赖
pnpm install

# 2. 为所有子包一次性生成 API 客户端
pnpm gen:all

# 3. 分别运行各子包测试
pnpm start:alova
pnpm start:axios
pnpm start:fetch
pnpm start:ky
```

或进入单个子包独立操作：

```bash
cd packages/alova-app
pnpm install
pnpm gen       # 等同于 worma gen -f
pnpm start     # 等同于 node src/main.js
```

## 📝 说明

- 共享的 `petstore.json` 位于 monorepo 根目录，各子包通过相对路径 `../../petstore.json` 引用
- 每个子包都是独立的 ESM 项目（`"type": "module"`）
- 生成的代码输出到各子包的 `src/api/` 下（已在 `.gitignore` 中忽略）
