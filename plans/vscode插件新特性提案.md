# VSCode 插件新特性提案

## 概述

基于 worma@2 的新特性，对 VSCode 插件进行配套升级，主要涉及状态栏交互、生成进度展示、侧边栏数据结构适配、以及自动更新配置管理的迁移。

---

## Feature 1: 状态栏禁用时的样式优化

### 背景

当未安装 `worma` 时，状态栏图标当前使用灰色 `#808080`，视觉上与已禁用状态混淆。

### 方案

将 `disable()` 中的颜色从 `#808080` 改为白色半透明 `#FFFFFF80`（即 50% 不透明度的白色，符合 VSCode 状态栏颜色格式 `#RRGGBBAA`）。

**变更文件：** `ext/commands/statusBar.ts`

```diff
- statusBarItem.color = '#808080'
+ statusBarItem.color = '#FFFFFF80'
```

---

## Feature 2: 状态栏点击出现 Action 列表

### 背景

当前点击状态栏直接触发生成，用户无法选择执行"初始化配置"还是"生成 API"。

### 方案

将状态栏的点击命令改为新增的 `worma.statusBar.showActions` 命令，点击后弹出 QuickPick 列表，包含以下 action：

1. **Create config file** — 调用 `worma.createConfig({ projectPath })`
2. **Generate apis** — 调用 `worma.generate(config, options)`

#### 子项目选择（Monorepo 支持）

选择任意 action 后，若当前 workspace 为 monorepo 结构（`worma.resolveWorkspaces` 返回多个子项目），则再弹出项目选择列表：

- 列表第一项为 **"All"**（默认选中），表示在全部子项目中依次执行
- 其余项为各子项目路径

**变更文件：**

- `ext/commands/commands.ts`：新增 `Commands.status_bar_show_actions`
- `ext/commands/statusBar.ts`：`enable()` 中将 command 改为新命令
- `ext/commands/generate.ts`（或新文件）：实现 action 选择逻辑

---

## Feature 3: 生成进度展示

### 背景

生成 API 时原本只有一个旋转图标，无法感知进度。

### 方案

利用 `worma.generate` 提供的 `onProgress` 回调：

1. **状态栏**：保持 loading 旋转图标，但文本由 "Loading..." 改为所有模块进度均值的百分比，格式为 `$(sync~spin) 45%`（取整，不保留小数）
2. **右下角弹框**：使用 `vscode.window.withProgress({ location: ProgressLocation.Notification })` 展示各模块（source）的独立进度信息

`onProgress` 回调签名（来自 worma@2）：

```ts
onProgress?: (snapshot: Record<string, GenerateProgress>) => void
// GenerateProgress: { source: string, progress: number, message?: string }
```

**进度均值计算：** 所有 source 的 `progress` 字段求平均，保留一位小数。

**变更文件：**

- `ext/commands/statusBar.ts`：`loading(text)` 改为 `loading(percent?: number)` 支持百分比文本
- `ext/functions/generate.ts`：在 `worma.generate` 调用中传入 `onProgress`，节流后更新状态栏
- `ext/commands/generate.ts`：在 `refresh` 命令中集成 `withProgress` 弹框

---

## Feature 4: 侧边栏与快速搜索数据结构适配

### 背景

worma@2 中 `getApiDocs` 的返回格式从 `Api[][]` 变更为 `CacheData[]`：

```ts
interface CacheData {
  path: string
  serverName?: string  // 服务器名称，用于侧边栏展示
  apis: Api[]           // 扁平的 API 数组
}
```

旧的 "Server N" 硬编码标签需要改为使用 `serverName`，回退为 `path`。

### 方案

#### 数据层（ext）

**`ext/functions/getApis.ts`**：

- `getApis(filePath)` 改为从 `CacheData[]` 中取 `flatMap(cd => cd.apis)`
- `getApiDocs()` 返回 `{ name, servers: CacheData[] }[]`（重命名字段 `apiDocs` → `servers`，类型从 `ApiDoc[][]` → `CacheData[]`）
- `isApiExists` 相应更新扁平化逻辑

#### 类型层

**`src/types.ts`**：

```ts
import type { CacheData } from 'wormajs'
export interface ApiProject {
  name: string
  servers: CacheData[]  // 原来的 apiDocs: ApiDoc[][]
}
```

#### 视图层（Vue）

**`src/components/ApiTree.vue`**：

- `getApiNode` 中服务器节点标签由 `Server ${idx + 1}` 改为 `server.serverName ?? server.path`
- 将 `server.apis`（`Api[]`）按 `api.tag` 分组为 `ApiDoc[]`，替换原来直接使用 `ApiDoc[]` 的逻辑

#### handlers 层

**`ext/handlers/index.ts`**：

- `getApiDocs` handler 的返回类型随 `ApiProject` 变更而更新

---

## Feature 5: autoUpdate 参数迁移至 VSCode 插件

### 背景

worma@2 去除了 `autoUpdate` 配置项和 `getAutoUpdateConfig` 导出函数，自动更新逻辑由 VSCode 扩展自行管理。

### 方案

在 VSCode 插件设置中新增 `autoUpdate` 配置项，并移除对 `worma.getAutoUpdateConfig` 的调用。

#### 配置语义

```ts
// 简写：直接 true/false
autoUpdate: true     // 默认，每 5 分钟更新一次
autoUpdate: false    // 关闭

// 详细配置对象
autoUpdate: {
  launchEditor: true,       // 编辑器开启时立即执行，默认 false
  interval: 5 * 60 * 1000  // 自动更新间隔 ms，默认 300000
}
```

#### VSCode 设置项定义

在 `package.json` 的 `contributes.configuration` 中新增：

| 设置项                          | 类型      | 默认值   | 说明                 |
| ------------------------------- | --------- | -------- | -------------------- |
| `worma.autoUpdate`              | `boolean` | `true`   | 是否启用自动更新     |
| `worma.autoUpdate.interval`     | `number`  | `300000` | 自动更新间隔（ms）   |
| `worma.autoUpdate.launchEditor` | `boolean` | `false`  | 编辑器启动时立即执行 |

#### 实现

**`ext/helper/autoUpdate.ts`**：

- 移除 `worma.getAutoUpdateConfig(config)` 调用
- 改为读取 VSCode workspace 配置 `config.get('worma.autoUpdate')` 等字段
- `launchEditor: true` 时，在 `refeshAutoUpdate` 首次调用时立即执行一次生成

**`ext/functions/readConfig.ts`**：

- `refeshAutoUpdate(dir, config)` 调用签名保持不变，但内部实现换源
