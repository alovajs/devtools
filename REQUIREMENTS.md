# Worma VS Code Extension — 需求文档

> 创建时间：2026-09-09
> 范围：`packages/worma`（核心）+ `packages/vscode-extension`（VS Code 插件）
> 约定：所有面向用户的 UI 文案使用**英文**；本文档其余部分为中文。

---

## 0. 背景与现状

- 扩展当前**没有任何自动行为**：自动更新机制（`ext/helper/autoUpdate.ts`、`highPrecisionInterval`、`worma.autoUpdate` 配置项、`Global` timer）已在之前的提交中全部移除。
- 生成只能在用户手动执行命令时触发：`Refresh` / `Force Generate APIs` / 状态栏 Actions。
- 核心已具备的变更判定能力（`packages/worma/src/helper/config/GeneratorHelper.ts`）：
  - 拉取并解析 spec → `TemplateParser.parse()` 得到 `allApis`；
  - `computePerTagHashes()` 计算「总哈希 + 每 tag 哈希」；
  - 与缓存 `.worma-cache/index.json` 中的 `hash` 比对，相同则**整段跳过生成**（无变化即 no-op）；
  - 不同则 `diffChangedTags()` 算出变更 tag，**仅增量渲染这些 tag** 的文件。
- 修订（见 A.6）：「整段跳过」将**从 `generate()` 移除**——`generate()` 改为「调用即生成」。
  变更检测职责统一交给 `checkUpdates()`（源级、spec 哈希、对所有调用方公开）。
  增量渲染（仅写变更 tag 的文件）保留，作为纯性能优化（不改变输出结果）。

---

## 需求 A：自动更新检测（Update Detection）— 已定稿

### A.1 目标

扩展初始化与窗口聚焦时，自动检测远程/本地 OpenAPI 数据源是否发生变化；
有变化时提示用户，**由用户确认后才生成**；绝不静默改写用户磁盘上的代码文件。

### A.2 已确认的决策

| #   | 决策                                                                   |
| --- | ---------------------------------------------------------------------- |
| 1   | 不做静默自动生成，只做「检测 + 通知 + 用户确认」                       |
| 2   | 提示方式 = 右下角 toast（只弹一次）+ 状态栏常驻入口，两者结合          |
| 3   | 检测只比较 **spec 原文哈希**，不解析、不执行任何插件钩子               |
| 4   | 首次 / 无缓存记录时**不提示**，只写入基线哈希                          |
| 5   | 触发时机只有「扩展激活」与「窗口聚焦」，**不做定时轮询**               |
| 6   | 聚焦节流默认 5 分钟，且必须可通过配置项调整                            |
| 7   | 检测过程静默（状态栏不出 loading），仅用户手动触发检查时才显示 loading |
| 8   | 检测失败（断网 / 401 / 超时）只写 Output + 状态栏 tooltip，不弹 toast  |
| 9   | 状态栏：文本最左侧显示小圆点，鼠标移入显示更新摘要                     |

### A.3 worma 核心改动

新增公开 API（复用既有代码，不重复实现）：

```ts
// packages/worma/src/checkUpdates.ts
export type SourceStatus = 'unchanged' | 'changed' | 'new' | 'error'

export interface SourceUpdateInfo {
  index: number            // 在 config.generator 中的下标
  output: string
  serverName?: string
  status: SourceStatus
  resolvedInput?: string   // 实际命中的 URL / 文件，作为缓存 key
  hash?: string            // 规范化后的 spec 原文哈希
  error?: string
}

export interface CheckUpdatesResult {
  projectPath: string
  updates: SourceUpdateInfo[]
  hasChanges: boolean
}

export async function checkUpdates(
  config: Config,
  options?: { projectPath?: string },
): Promise<CheckUpdatesResult>
```

复用点：

| 能力                                                                             | 复用来源                                                                                              |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 取 spec 原文（本地读文件 / 远程 fetch / 多 URL `Promise.any` 竞速 / 有效性探针） | 将 `core/parser/openApiParser/helper.ts` 中私有的 `fetchRawText` 导出为 `getRawSpecText()`            |
| 规范化 + 哈希                                                                    | 复用 `js-yaml`（已有依赖）+ `node:crypto`；新增 `computeSpecHash(text)` 放在 `functions/wormaJson.ts` |
| 缓存目录 / monorepo 统一 cacheRoot / 路径 key                                    | 复用 `functions/wormaJson.ts` 的 `cacheDirPath()`、`getCacheRoot()`、`toCacheRelativePath()`          |

存储与基线（合并进 `index.json`）：

- **不新增独立 `sources.json`**，改为在既有 `index.json` 的每条 entry 中增加 `source` 子字段：
  `{ path, serverName, hash, tags, source?: { resolvedInput, rawHash, updatedAt } }`
  - `rawHash`：规范化的 spec 原文哈希（检测用，对应原 `sources.json` 的 `hash`）；
  - `resolvedInput`：实际命中的 URL / 文件（检测基线辅助信息）；
  - `updatedAt`：基线建立 / 生成成功的时间戳（即"生成日期"）。
- `index.json` 的 `hash` / `tags` 与 `data/<slug>.json` 仍由生成侧更新；检测侧**只读写 `source` 子字段**，不触碰 `hash` / `tags`。
- `generate()` 的「整段跳过」逻辑（见 A.6 决策）移除，变更检测职责交给 `checkUpdates()`。
- **基线更新**：`generate()` 成功后顺带写入 `source.rawHash`；
  `getOpenApiDataWithUrl` 内部已持有原文，扩展其返回值带上 `rawText`，在写 `index.json` 的同一处更新 `source` 字段，**零额外请求**。

约束：

1. 检测不执行任何插件钩子（`beforeSpecParse` / `specParsed` / `beforeCodeGenerate` / `beforeFileWrite` / `codeGenerated`）；检测只读写 `index.json` entry 的 `source` 子字段（检测基线），**不修改**同 entry 的 `hash` / `tags`（生成缓存）。
2. 缓存 key 用 `resolvedInput`（实际命中的 URL），而非 `input` 原始值。
3. `input` 支持数组（首个成功者生效），沿用既有竞速逻辑。
4. 已知取舍：spec 描述类改动会导致误报（可接受）；不提供 tag 级差异（需要解析才有）。
5. `checkUpdates()` 当前**仅供扩展的 `UpdateChecker` 用于自动更新提示**；CLI / 其它调用方直接 `generate()`（固定写文件），不预检、不依赖 `checkUpdates()`（见 A.6 决策 3）。

### A.4 扩展改动

新增 `ext/core/UpdateChecker.ts`：

```
triggers : 激活（延迟 ~3s）+ 窗口聚焦（onDidChangeWindowState）
throttle : minInterval，默认 300000ms
guard    : in-flight 锁；Global.loading 为真时跳过（与生成互斥）
dedupe   : notified: Map<`${projectPath}::${output}`, hash>，同一 hash 只提示一次
failure  : 只写 Output + 状态栏 tooltip
no-cache : status === 'new' 时仅写基线，不提示
loading  : 静默检测，不出 spinner
```

配置项（`package.json`，`worma.autoUpdate.*`）：

```jsonc
"enable":             { "type": "boolean", "default": true },
"checkOnActivation":  { "type": "boolean", "default": true },
"checkOnWindowFocus": { "type": "boolean", "default": true },
"minInterval":        { "type": "number",  "default": 300000, "description": "Minimum interval (ms) between two update checks. Default: 5 minutes." }
```

UI 文案（英文）：

- Toast（聚合，同一 hash 只弹一次）：`Worma: 3 API sources updated`，按钮 `Generate` / `Ignore`
- 状态栏文本：`$(circle-small-filled) Worma`
- 状态栏 tooltip（检测到更新时）：`N files updated`（N = 有更新的源数量；小圆点 + 该 tooltip 共同构成更新提示）
- 点击状态栏 → QuickPick：`$(zap) Generate All` / `$(x) Ignore` / 按项目分组的单选项

### A.5 后续优化（P1，已确认要做）

- 原文短 TTL（60s）内存缓存：检测后点击 `Generate` 不再二次请求。

---

## 需求 A（补充）：generate 与 checkUpdates 的职责划分 — 已定稿

### A.6 修订决策（2026-09-09）

| #   | 决策                                                                                                                                                          | 理由                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `generate()` **移除「整段跳过」**（hash 命中即 no-op 的提前 return）                                                                                          | 变更检测已由 `checkUpdates()` 承担；`generate()` 改为「调用即生成」             |
| 2   | `generate()` **固定走缓存增量渲染**：始终基于 `index.json` 计算 `changedTags`，仅渲染/写入变更的 tag 文件；不再提供「全量重渲染」选项                         | 纯性能优化且不改变输出；spec 误报（变了但输出不变）时仅有全局文件重写，开销极小 |
| 3   | `checkUpdates()` **仅由扩展的 `UpdateChecker` 用于自动更新提示**；CLI / 其它调用方直接 `generate()`（固定写），不预检                                         | 用户明确：CLI 不需要先检测，固定生成即可                                        |
| 4   | **删除 `force` 参数**（签名 + 所有调用点）                                                                                                                    | 全量重渲染不再是需求；增量渲染已足够，移除后语义更清晰                          |
| 5   | 移除 no-op 与 `force` 后，`generate()` 不再保证幂等、也不再有「全量」模式；**模板 / 插件配置变更不会触发未变更 tag 的重渲染**，需清缓存或后续引入 config 指纹 | 用户确认接受该取舍（见 A.7 已知限制）                                           |

`force` 删除对扩展命令的影响：

- 扩展原 `Force Generate APIs` 命令不再有「全量」语义；保留为「触发一次生成」（与 `Generate` 等价），或后续重命名为 `Regenerate`。

### A.7 本轮实现任务清单（实现阶段）

| 项                     | 改动                                                                                                                                                                                                                                                    | 对应决策                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 移除整段跳过           | `GeneratorHelper.generate()` 删除 `oldEntry.hash === newHashInfo.hash` 的提前 return；保留其后 `diffChangedTags()` 计算                                                                                                                                 | 1                                                                           |
| 删除 `force`           | `generate.ts` / `GeneratorHelper.generate` 签名移除 `force`；扩展 `ext/functions/generate.ts`、`commands/*` 不再传 `force`                                                                                                                              | 4                                                                           |
| 固定增量渲染           | 原 `if (!force)` 护卫去掉：`getCacheEntry` + `diffChangedTags` 始终执行；`changedTags` 恒参与 `generateFromTemplateDir`                                                                                                                                 | 2；首次无缓存时 `changedTags` 为 `undefined` → 渲染全部 tag（等价首次全量） |
| 删除 tag 孤儿文件      | `generateFromTemplateDir` 末尾：取 `changedTags` 中「已删除」的 tag（旧有、新无），删掉 `outputDir` 下对应 tag 目录/文件                                                                                                                                | 修复长期隐患                                                                |
| 优化① 增量写 data 文件 | `data/<slug>.json` 由「单文件全量重写」改为「按 tag 分文件存储 `data/<slug>/<tag>.json`」，仅写变更的 tag；`readCacheApis` / `readAllCacheApis` 聚合读取                                                                                                | 降低大 spec 每次生成的 IO                                                   |
| 合并检测基线           | 取消独立 `sources.json`；`index.json` entry 增加 `source: { resolvedInput, rawHash, updatedAt }`；`checkUpdates` 只读写该子字段，`writeCacheIndex` 增加「仅更新 source、保留 hash/tags」的写法；`getCacheEntry` 对无 `tags` 的 entry 视为「无生成基线」 | 配套 A.3 合并决策                                                           |

已知限制（本轮不解决，记录待办）：

- 模板 / 插件配置变更后，未变更 data 的 tag 不会被重渲染（增量依据是 api 哈希，不含模板/配置）。后续可引入「模板 + `generatorConfig` 指纹」并入 diff 判定。
- `data/` 改为分文件存储后，`readCacheApis` 需聚合多个 tag 文件；扩展的 Api Docs webview 与需求 B 变更报告均依赖该读取，需回归。

---

## 需求 B：生成变更点记录（Change）— 已定稿

### B.1 目标

每次 `generate` 成功后记录「本次发生了什么变化」，让用户能快速回看变更点（新增 / 删除 / 修改了哪些 API，改了哪些字段）。
记录以「一次生成 run」为粒度聚合为一条变更记录。

### B.2 现状基础（可复用）

- 经优化①后，缓存 `data/` 改为**按 tag 分文件**存储：`data/<slug>/<tag>.json`，`readAllCacheApis(projectPath)` 聚合得到上一次生成的完整 API 列表（`apis`）。B 的「变更前」数据即来自此读取（在 `flushAllData` 覆盖前读取）。
- `computeApiHash()` 已能对单个 API 计算稳定哈希（含 `tag / method / path / name / response / requestBody / queryParameters / pathParameters`）。
- `diffChangedTags()` 已能给出变化的 tag 集合，`GeneratorHelper` 在生成时已持有新解析的 `allApis`。
- 因此「变更前 vs 变更后」的两侧数据都已具备，只需新增一个 API 级 diff 函数 + 持久化 + 读取/展示入口。

### B.3 方案（已定：持久化 JSON + CLI 浏览 + Webview 呈现）

综合候选 B-2 / B-3：生成后把变更记录写成机器可读的 `changes/<NNNN>.json`，提供 CLI 命令 `worma diff` 浏览，扩展侧提供 Webview 呈现（按 generator / tag 分组，支持搜索）。不额外生成 Markdown 文件（Webview 负责渲染）。

- 记录目录：`<cacheRoot>/changes/`（cacheRoot 沿用 `getCacheRoot()`，monorepo 各项目独立）。
- 单条记录文件：`<cacheRoot>/changes/<NNNN>.json`，`<NNNN>` 为零填充 4 位序号（见 B.6）。
- 一条记录 = 一次 `generate` run 的聚合结果，内含多个 generator（output）分组的 `added / removed / modified`。

### B.4 与需求 A 的关系（结论：同一套基础设施，但不是同一个功能）

- 相同：都基于「缓存的旧状态 vs 当前状态」做差异计算，都复用 `functions/wormaJson.ts` 的缓存与哈希工具。
- 不同：
  - A 是**生成前**的**源级别**检测（spec 原文哈希，廉价、无副作用），仅用于「是否提示更新」；
  - B 是**生成后**的 **API 级别**差异（需要解析后的数据，精确到字段），仅用于「记录并呈现变更」。
- 因此抽象一个统一的 **change-tracking 层**：哈希 / diff 工具放在 `functions/wormaJson.ts` 与新增的 `functions/diffApis.ts`；
  A 与 B 各自作为该层的两个不同阶段（pre-check / post-report）调用，**不合并成同一个函数**。

### B.5 函数与类型（worma 核心）

新增 `packages/worma/src/functions/changeReport.ts`（命名沿用约定，不含 "Report"）：

```ts
// 内部函数（generate 内调用，不导出）
function captureChange(projectPath: string, change: Change): string
//   - 仅在「有变化」时由 generate 调用（见 B.7 调用时机）
//   - 写 changes/<NNNN>.json，递增 index.json 的 changeSeq，返回 id（如 "0007"）

// 导出函数（CLI 与扩展共用，单一数据源）
export function listChanges(projectPath: string): ChangeSummary[]
export function getChange(projectPath: string, id: string): Change | undefined
//   - id 可为 "0007" 或别名 "latest"（= 最大序号）
```

数据类型：

```ts
interface ChangeSummary {            // 列表项（轻量）
  id: string                         // "0007"
  createdAt: number
  summary: { generators: number; added: number; removed: number; modified: number }
  outputs: string[]                 // 涉及的 output 列表
}
interface Change {                   // 完整记录
  id: string
  createdAt: number
  projectPath: string
  generators: ChangeItem[]
}
interface ChangeItem {
  output: string
  serverName?: string
  added: ApiChange[]
  removed: ApiChange[]
  modified: ApiFieldChange[]
}
interface ApiChange { method: string; path: string; name?: string; tag?: string }
interface ApiFieldChange { method: string; path: string; name?: string; tag?: string; changedFields: string[] }
```

API 匹配键 = `${method} ${path}`（比 `name` 稳定，能正确识别重命名/路径调整）。
`modified` 的 `changedFields` 由 `functions/diffApis.ts` 的 `diffApis(oldApis, newApis)` 计算：
对匹配到的同 key API，逐项比对 `response / requestBody / queryParameters / pathParameters`（可借助 `computeApiHash` 或字段级深比较），列出发生变化的字段名。

### B.6 ID 规则与保留条数

- **序号生成**：在 `index.json` 维护整数计数器 `changeSeq`（无则 0）；每次 `captureChange` 时 `seq = changeSeq + 1`，文件名 `changes/${String(seq).padStart(4,'0')}.json`（即 `changes/0007.json`）。
- **`latest` 别名**：`getChange(projectPath, 'latest')` 取 `changeSeq` 对应的最新记录。
- **无前缀**：文件名不加 `change-` 前缀（记录已隔离在 `changes/` 目录内，前缀非必需）。
- **保留条数**：`wormaJson` 配置项 `changeHistoryLimit`（默认 **100**）；`captureChange` 写新记录后裁剪超出窗口的旧文件（保留最近 `changeHistoryLimit` 条，`0` 表示全部保留）。

### B.7 调用时机（generate 内部）

- 在 `GeneratorHelper.generate()` 中、`flushAllData` 覆盖旧 `data/` **之前**：
  1. 用 `readAllCacheApis(projectPath)` 读取「变更前」完整 API 列表（旧缓存，尚未被覆盖）；
  2. 与本次新解析的 `allApis` 调 `diffApis` 计算 `added / removed / modified`；
  3. 若该 run 的 `added+removed+modified` 全为 0 → **不写记录**（用户确认：无任何变化时保持与原来一致，不新增变更记录）；
  4. 否则组装 `Change` 调 `captureChange` 落盘，并递增 `index.json.changeSeq`。

### B.8 CLI 行为

新增命令 `worma diff`（复用 `listChanges` / `getChange`）：

| 用法                               | 行为                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `worma diff` / `worma diff --list` | 调用 `listChanges`，表格列出 id + 时间 + 各 output + `+added / -removed / ~modified` |
| `worma diff <id>`                  | 调用 `getChange(projectPath, id)`，表格展示该记录完整明细（按 generator 分组）       |
| `worma diff latest`                | 等价 `getChange(projectPath, 'latest')`                                              |

### B.9 扩展行为

1. **新增命令** `worma.openChanges`：打开 Changes Webview，默认定位 `latest`。
2. **状态栏列表入口**：在点击右下角状态栏按钮弹出的 QuickPick（见 A.4）中新增一项 `Review API Changes`，执行 `worma.openChanges`。
3. **生成成功 toast**：`generate` 成功后（有变化时）弹出
   `Worma: 7 APIs changed (3 added, 2 removed, 2 modified)`，按钮 `View Changes` → 执行 `worma.openChanges` 并定位本次记录。
4. **Webview**：读取 `listChanges` / `getChange`，渲染按 generator 分组的变更清单，支持按 tag / 字段名搜索；点击条目可跳转至生成的源文件（可选，P1）。

### B.10 本轮实现任务清单

| 项                      | 改动                                                                                                                           | 对应 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 新增 diff 工具          | `functions/diffApis.ts`：`diffApis(oldApis, newApis)`，按 `method+path` 匹配，输出 `added/removed/modified` 与 `changedFields` | B.5  |
| 新增变更记录模块        | `functions/changeReport.ts`：`captureChange`（内部）/ `listChanges` / `getChange`（导出）                                      | B.5  |
| index.json 加 changeSeq | `writeCacheIndex` 支持读写 `changeSeq`；`captureChange` 递增                                                                   | B.6  |
| 生成内调用              | `GeneratorHelper.generate` 在 `flushAllData` 前调 `captureChange`（无变化跳过）                                                | B.7  |
| 裁剪旧记录              | `captureChange` 按 `changeHistoryLimit` 删超出窗口文件                                                                         | B.6  |
| CLI `worma diff`        | `packages/worma` CLI 新增 `diff` 子命令                                                                                        | B.8  |
| 扩展命令 + Webview      | `worma.openChanges` + Changes Webview + 状态栏 QuickPick 项 `Review API Changes`                                               | B.9  |
| 生成 toast              | 成功 toast 增加 `View Changes` 按钮                                                                                            | B.9  |

已知限制（本轮不解决，记录待办）：

- `diffApis` 基于 `method+path` 匹配，路径调整会判为「删除旧 + 新增新」，不推断 rename。
- 模板 / 插件配置变更导致的输出差异不在 API 级 diff 范围内（与 A.7 已知限制同源）。

---

## 需求 C：扩展状态栏不可用态指示（扩展优化）— 已定稿

### C.1 目标

当项目未安装 `wormaJs`（核心包不可用）时，右下角状态栏 Worma 图标切换为「带斜删除线 / 禁用」图标，直观表示当前扩展不可用。

### C.2 决策

- 状态栏可用性检测沿用扩展既有的 wormaJs 安装探测；探测结果为「未安装」时：
  - **仅将图标改为禁用态 Codicon `$(circle-slash)`**（circle with slash，表示不可用）；**tooltip 文案保持不变**（沿用正常态文案，不改为「未安装」提示）。
- 已安装时维持既有 `$(circle-small-filled) Worma` 图标与正常 tooltip。
- 该图标态与需求 A 的「更新小圆点」相互独立：小圆点表示「有源更新待生成」，禁用图标表示「核心不可用」；两者可叠加展示。

### C.3 实现任务

- 扩展状态栏模块新增「可用性」状态位；wormaJs 未安装时使用 `$(circle-slash)` 并禁用点击动作（或点击提示安装）。

---

## 验收清单

- [ ] 无缓存时启动扩展：静默写入基线，不弹任何提示
- [ ] 远程 spec 变更 + 窗口聚焦（距上次 > 5 分钟）：弹出一次 `Generate / Ignore`
- [ ] 同一份变更未处理时反复聚焦：不再重复弹窗；状态栏保持小圆点
- [ ] 点 `Ignore`：本次变更不再提示；远程再次变化后重新提示
- [ ] 点 `Generate`：正常生成，且生成后状态栏小圆点消失
- [ ] 断网时触发检测：不弹错误 toast，仅 Output 有记录
- [ ] `worma.autoUpdate.enable = false`：完全不检测
- [ ] 检测过程只更新 `index.json` entry 的 `source` 基线字段，不修改 `hash` / `tags`，不执行插件钩子（无独立 `sources.json` 文件）
- [ ] `generate()` 在 spec 无变化时不再 no-op 跳过：仍走增量渲染，无变更 tag 不重写其文件；全局文件按既有逻辑重写
- [ ] 移除 no-op 后，`generate()` 不再幂等；CLI 直接 `generate()`（固定写），无需预检
- [ ] 删除 `force` 后：签名与所有调用点（含扩展 `ext/functions/generate.ts`、`commands/*`）均无 `force`；扩展 `Force Generate APIs` 退化为等价 `Generate`
- [ ] 固定增量渲染：无缓存首跑渲染全部 tag；有缓存时仅变更 tag 被重写，未变更 tag 文件 mtime 不变
- [ ] tag 被删除后，其旧文件 / 目录在 `generate()` 后被清理（无孤儿文件）
- [ ] 优化①：`data/` 改为分文件存储；大 spec 重复生成不再全量重写 data 文件，`readCacheApis` 仍能拿到完整列表
- [ ] 需求 B：`generate` 有变化时在 `changes/` 下写入 `NNNN.json` 记录；`listChanges` / `getChange` 能正确列/取；`latest` 别名生效
- [ ] 需求 B：生成无任何 API 变化时（added/removed/modified 全 0）不写变更记录，也不弹 `View Changes`
- [ ] 需求 B：`changeHistoryLimit` 默认 100，超出窗口的旧记录被裁剪（`0` 表示全部保留）
- [ ] 需求 B：CLI `worma diff` 可列记录 / 看明细 / 用 `latest` 别名
- [ ] 需求 B：扩展 `worma.openChanges` 打开 Webview；状态栏 QuickPick 含 `Review API Changes`；生成成功 toast 含 `View Changes`
- [ ] 需求 C：wormaJs 未安装时状态栏图标改为 `$(circle-slash)`，tooltip 文案保持不变；已安装时恢复常态

## 测试

- `packages/worma/test/checkUpdates.spec.ts`：`unchanged / changed / new / error` 四类用例；
  断言检测**不修改** `index.json`、`sources.json` 基线写入正确。
- `packages/worma/test/specHash.spec.ts`：规范化哈希对 key 顺序、空白、YAML/JSON 等价形式稳定。
