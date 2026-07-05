# VSCode 插件规范说明

> 版本：v2.0-draft
> 最后更新：2026-06-12
> 状态：**规划阶段，等待确认后开始编写代码**

---

## 开发进度总览

| #   | 特性                        | 状态      | 说明                            |
| --- | --------------------------- | --------- | ------------------------------- |
| 1   | 状态栏禁用样式优化          | ✅ 已完成 | 灰色 → 白色半透明               |
| 2   | 状态栏 Action 列表          | ✅ 已完成 | 点击弹框选择动作 + 子项目选择   |
| 3   | 生成进度展示                | ✅ 已完成 | 状态栏百分比 + 右下角进度通知   |
| 4   | 侧边栏/快速搜索数据结构适配 | ✅ 已完成 | CacheData 结构，serverName      |
| 5   | autoUpdate 参数迁移         | ✅ 已完成 | 从 worma 配置迁移到 VSCode 设置 |

---

## 详细规范

### Feature 1：状态栏禁用样式优化

**目标文件：** `packages/vscode-extension/ext/commands/statusBar.ts`

**变更内容：**

```diff
 export function disable() {
   Global.setEnabled(false)
   statusBarItem.text = `$(worma-icon-id) Alova`
   statusBarItem.tooltip = 'module `worma` not found'
-  statusBarItem.color = '#808080'
+  statusBarItem.color = '#FFFFFF80'
   statusBarItem.command = undefined
 }
```

**验收标准：**

- 未安装 `worma` 时，状态栏图标显示为 50% 不透明度白色
- 安装后恢复正常颜色（`undefined`）

---

### Feature 2：状态栏点击 Action 列表 + Monorepo 子项目选择

#### 2.1 新增命令

**`ext/commands/commands.ts`** 新增：

```ts
status_bar_show_actions = 'worma.statusBar.showActions'
```

#### 2.2 `enable()` 绑定新命令

**`ext/commands/statusBar.ts`**：

```diff
- statusBarItem.command = Commands.refresh
+ statusBarItem.command = Commands.status_bar_show_actions
```

#### 2.3 实现 Action 选择逻辑

新建文件：`ext/commands/statusBarActions.ts`

**流程：**

```
用户点击状态栏
  └─ 弹出 QuickPick（Step 1: 选择 Action）
       ├─ "Create config file"
       └─ "Generate apis"

  └─ 解析 workspaces
       ├─ 单项目（1 个子项目） → 直接执行
       └─ 多项目（Monorepo） → 弹出 QuickPick（Step 2: 选择项目）
            ├─ "All"（默认选中）
            └─ [各子项目路径列表]

  └─ 执行对应 action
       ├─ "Create config file" → worma.createConfig({ projectPath })（每个目标项目）
       └─ "Generate apis"      → ApiGenerate.readConfig() + ApiGenerate.generate()
```

**子项目列表获取方式：**

使用已有的 `readConfig.ts` 中的 `resolveWorkspaces()`，它内部调用 `worma.resolveWorkspaces(workspacePath)`。

**QuickPick Step 1 定义：**

```ts
interface ActionItem extends vscode.QuickPickItem {
  action: 'createConfig' | 'generateApis'
}

const actions: ActionItem[] = [
  { label: 'Create config file', action: 'createConfig' },
  { label: 'Generate apis', action: 'generateApis' },
]
```

**QuickPick Step 2 定义（多项目时）：**

```ts
interface ProjectItem extends vscode.QuickPickItem {
  projectPath: string | 'all'
}

const items: ProjectItem[] = [
  { label: 'All', description: 'Run in all projects', projectPath: 'all', picked: true },
  ...projects.map(p => ({ label: p, projectPath: p })),
]
```

**执行逻辑：**

| action       | projectPath | 实际执行                                                                                    |
| ------------ | ----------- | ------------------------------------------------------------------------------------------- |
| createConfig | all         | 遍历所有项目 `worma.createConfig({ projectPath })`                                          |
| createConfig | 具体路径    | `worma.createConfig({ projectPath })`                                                       |
| generateApis | all         | `ApiGenerate.readConfig()` + `ApiGenerate.generate({ force: true })`                        |
| generateApis | 具体路径    | `ApiGenerate.readConfig(path)` + `ApiGenerate.generate({ force: true, projectPath: path })` |

**目标文件：**

- `ext/commands/commands.ts`（新增枚举值）
- `ext/commands/statusBar.ts`（修改 `enable()` 中的 command）
- `ext/commands/statusBarActions.ts`（新文件，实现 Action 选择与调度）
- `ext/commands/index.ts`（注册新命令）

---

### Feature 3：生成进度展示

#### 3.1 状态栏百分比

**`ext/commands/statusBar.ts`**：

修改 `loading` 函数签名，支持传入百分比：

```ts
export function loading(text: string = '') // 现有签名不变，内部实现调整
export function updateLoadingProgress(percent: number) // 新增：更新进度文本
```

`updateLoadingProgress` 实现：

```ts
export function updateLoadingProgress(percent: number) {
  if (Global.loading) {
    statusBarItem.text = `$(sync~spin) ${Math.round(percent)}%`
  }
}
```

#### 3.2 右下角进度通知

**`ext/functions/generate.ts`**：

在 `worma.generate` 调用时传入 `onProgress` 回调，通过节流（500ms）更新 `updateLoadingProgress`：

```ts
import type { GenerateProgress } from 'worma'

export default async (option?: GenerateOption) => {
  // ...
  for (const [projectPath, config] of Global.getConfigs()) {
    // ...
    const generateResult = await worma.generate(config, {
      force,
      projectPath,
      onProgress(snapshot: Record<string, GenerateProgress>) {
        const values = Object.values(snapshot)
        if (values.length === 0) return
        const avg = Math.round(values.reduce((sum, p) => sum + p.progress, 0) / values.length)
        updateLoadingProgress(avg)
      },
      progressInterval: 500,
    })
    // ...
  }
}
```

#### 3.3 右下角通知弹框进度

**`ext/commands/generate.ts`** 的 `refresh` 命令改造：

使用 `vscode.window.withProgress` 包裹生成流程，展示各模块分项进度：

```ts
import { window, ProgressLocation } from 'vscode'

// 在 refresh 命令中：
await window.withProgress(
  {
    location: ProgressLocation.Notification,
    title: 'Generating APIs',
    cancellable: false,
  },
  async (progress) => {
    let lastReport: Record<string, GenerateProgress> = {}
    // 通过 GenerateOption 的 onProgress 回调驱动
    await ApiGenerate.generate({
      force: true,
      onProgress(snapshot) {
        // 构建多行进度文本
        const lines = Object.entries(snapshot)
          .map(([src, p]) => `[${src}] ${p.progress}% ${p.message ?? ''}`)
          .join('\n')
        progress.report({ message: lines })
        lastReport = snapshot
      },
    })
  }
)
```

需要将 `onProgress` 回调沿调用链传递：

- `ApiGenerate.generate(options)` → `generate(options)` → `worma.generate(config, { ..., onProgress })`

**变更文件：**

- `ext/commands/statusBar.ts`（新增 `updateLoadingProgress`）
- `ext/functions/generate.ts`（接收并转发 `onProgress`，计算均值，调用 `updateLoadingProgress`）
- `ext/core/ApiGenerate.ts`（`GenerateOption` 新增 `onProgress`，透传给 `generate()`）
- `ext/commands/generate.ts`（`refresh` 命令包裹 `withProgress`）

---

### Feature 4：侧边栏/快速搜索数据结构适配

#### 4.1 背景

worma@2 的 `getApiDocs` 返回类型从 `Api[][]` 变为 `CacheData[]`：

```ts
interface CacheData {
  path: string
  serverName?: string
  apis: Api[]
}
```

#### 4.2 数据层（ext）

**`ext/functions/getApis.ts`**：

```ts
// getApis: 取消 flatMap ApiDoc[]，改为直接 flatMap CacheData.apis
export async function getApis(filePath: string) {
  const [projectPath, config] = Global.getConfigs().find(...) ?? []
  if (!config) return []
  const cacheList = await worma.getApiDocs(config, projectPath)  // CacheData[]
  return cacheList.flatMap(cd => cd.apis)
}

// getApiDocs: 返回结构变更
export async function getApiDocs() {
  return Promise.all(
    Global.getConfigs().map(async ([projectPath, config]) => ({
      name: getFileNameByPath(projectPath),
      servers: await worma.getApiDocs(config, projectPath),  // CacheData[]
    })),
  )
}

// isApiExists: 随之更新
export async function isApiExists(api: Api | null) {
  if (!api) return false
  const apiProjects = await getApiDocs()
  const apis = apiProjects.flatMap(item => item.servers.flatMap(cd => cd.apis))
  return apis.some(item => item.global === api.global && item.pathKey === api.pathKey)
}
```

#### 4.3 类型层

**`src/types.ts`**：

```ts
import type { Api, ApiDoc, CacheData, HandlersType } from '#/handlers'

export type ApiType = 'project' | 'server' | 'group' | 'api'
export interface ApiProject {
  name: string
  servers: CacheData[]   // 原 apiDocs: ApiDoc[][]
}
export type { Api, ApiDoc, CacheData, HandlersType }
```

**`typings/handlers.d.ts`**（或 `ext/handlers/index.ts`）：

- 导出 `CacheData` 类型
- 更新 `ApiProject = { name: string; servers: CacheData[] }`

#### 4.4 视图层（Vue）

**`src/components/ApiTree.vue`** 的 `getApiNode` 函数：

```ts
function getApiNode(projects: ApiProject[]) {
  const nodes: ApiNode[] = []
  for (const project of projects) {
    const serverNodes: ApiNode[] = []
    nodes.push({
      id: project.name,
      level: 1,
      type: 'project',
      label: project.name,
      children: serverNodes,
    })
    project.servers.forEach((server, idx) => {
      // 使用 serverName，回退为 path（取最后一段路径名）
      const serverLabel = server.serverName ?? server.path.split('/').pop() ?? server.path
      const groupNodes: ApiNode[] = []
      serverNodes.push({
        id: `server-${project.name}-${idx}`,
        level: 2,
        type: 'server',
        label: serverLabel,
        children: groupNodes,
      })
      // 将扁平 apis 按 tag 分组
      const tagMap = new Map<string, Api[]>()
      for (const api of server.apis) {
        if (!tagMap.has(api.tag)) tagMap.set(api.tag, [])
        tagMap.get(api.tag)!.push(api)
      }
      tagMap.forEach((apis, tag) => {
        const apiNodes: ApiNode[] = apis.map(api => ({
          id: `${api.global}.${api.pathKey}`,
          level: 4,
          type: 'api' as ApiType,
          label: `${api.method}\n${api.path}`,
          api,
        }))
        groupNodes.push({
          id: `group-${project.name}-${idx}-${tag}`,
          level: 3,
          type: 'group',
          label: tag,
          children: apiNodes,
        })
      })
    })
  }
  return nodes
}
```

**变更文件：**

- `ext/functions/getApis.ts`
- `ext/handlers/index.ts`（类型更新）
- `src/types.ts`
- `src/components/ApiTree.vue`（`getApiNode` 重构）

---

### Feature 5：autoUpdate 参数迁移至 VSCode 插件

#### 5.1 背景

worma@2 移除了 `autoUpdate` 配置和 `getAutoUpdateConfig` 函数，自动更新由 VSCode 插件自行管理。

#### 5.2 VSCode 设置项

在 `packages/vscode-extension/package.json` 的 `contributes.configuration.properties` 中新增：

```json
"worma.autoUpdate": {
  "type": ["boolean", "object"],
  "default": true,
  "description": "Whether to automatically update APIs. Can be true/false or a detailed config object.",
  "properties": {
    "launchEditor": {
      "type": "boolean",
      "default": false,
      "description": "Update immediately when editor launches."
    },
    "interval": {
      "type": "number",
      "default": 300000,
      "description": "Auto-update interval in milliseconds."
    }
  }
}
```

#### 5.3 读取配置

**`ext/helper/autoUpdate.ts`** 重构：

```ts
import { workspace } from 'vscode'

interface AutoUpdateConfig {
  isStop: boolean
  immediate: boolean
  time: number  // 秒
}

function getAutoUpdateConfig(): AutoUpdateConfig {
  const raw = workspace.getConfiguration().get<boolean | { launchEditor?: boolean; interval?: number }>('worma.autoUpdate', true)
  if (raw === false) {
    return { isStop: true, immediate: false, time: 300 }
  }
  if (raw === true) {
    return { isStop: false, immediate: false, time: 300 }
  }
  return {
    isStop: false,
    immediate: raw.launchEditor ?? false,
    time: Math.round((raw.interval ?? 300000) / 1000),
  }
}

export async function refeshAutoUpdate(path: string, config: Config) {
  const { time, immediate, isStop } = getAutoUpdateConfig()
  // ... 后续逻辑与原有相同
}
```

#### 5.4 移除对 worma 的依赖

移除 `ext/helper/autoUpdate.ts` 中 `worma.getAutoUpdateConfig(config)` 的调用。

**变更文件：**

- `packages/vscode-extension/package.json`（新增配置项）
- `ext/helper/autoUpdate.ts`（移除 worma 调用，改读 VSCode 配置）

---

## 文件变更总览

| 文件                               | 类型     | 特性       |
| ---------------------------------- | -------- | ---------- |
| `ext/commands/statusBar.ts`        | 修改     | F1, F2, F3 |
| `ext/commands/commands.ts`         | 修改     | F2         |
| `ext/commands/statusBarActions.ts` | **新建** | F2         |
| `ext/commands/generate.ts`         | 修改     | F3         |
| `ext/commands/index.ts`            | 修改     | F2         |
| `ext/core/ApiGenerate.ts`          | 修改     | F3         |
| `ext/functions/generate.ts`        | 修改     | F3         |
| `ext/functions/getApis.ts`         | 修改     | F4         |
| `ext/handlers/index.ts`            | 修改     | F4         |
| `ext/helper/autoUpdate.ts`         | 修改     | F5         |
| `src/types.ts`                     | 修改     | F4         |
| `src/components/ApiTree.vue`       | 修改     | F4         |
| `package.json`                     | 修改     | F5         |

---

## 开发顺序建议

1. **F1**（最简单，独立改动）
2. **F5**（移除 worma 依赖，基础设施）
3. **F4**（数据结构适配，影响最广）
4. **F2**（交互逻辑，依赖 F4 的 resolveWorkspaces 已就位）
5. **F3**（进度展示，依赖 F2 的 Action 流程）

---

## 当前进度

> 2026-06-12：**全部特性编码完成。**

- ✅ F1 状态栏样式优化
- ✅ F2 Action 选择列表
- ✅ F3 生成进度展示
- ✅ F4 侧边栏/快速搜索数据结构适配
- ✅ F5 autoUpdate 迁移
