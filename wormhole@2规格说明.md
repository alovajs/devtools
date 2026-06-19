# Wormhole@2 规格说明（Spec）

> 本文为基于《wormhole@2 新特性提案.md》的工程化规格说明，作为后续开发与验收依据。
> 适用范围：`packages/wormhole`（核心库 + CLI）、`packages/vscode-extension`（消费缓存数据）。
> 文档版本：v1.1。
>
> **实现状态图例**
>
> - ✅ 已实现并测试通过
> - 🔲 待实现
> - 🔶 部分实现

---

## 1. 目标与非目标

### 1.1 目标

- ✅ **G1 通用化**：将 wormhole 从 alova 专属生成器升级为通用 OpenAPI 代码生成工具。
- ✅ **G2 模板可插拔**：内置 `alova` / `alovaGlobals` / `axios` / `fetch` / `ky` 五套模板，并支持用户自定义模板。
- ✅ **G3 友好化配置**：除 `defineConfig` 外，新增 `.alovarc` 极简文本配置。
- ✅ **G4 工程化产物**：生成代码支持 tree-shaking、按 tag 拆分文件、可控覆盖策略。
- ✅ **G5 标准化数据**：统一 `TemplateData` 与缓存数据结构，使 IDE 插件、AI Skill、模板渲染共享同一数据契约。
- ✅ **G6 AI 友好**：通过 `aiDoc` 插件生成 Skill 文档，展示文件位置信息以指导 AI 生成正确的代码。

### 1.2 非目标

- 不再支持 alova v2 模板（仅保留 v3）。
- 不计划支持除 handlebars 以外的模板引擎。
- 不在本次 release 中引入新的请求库（如 superagent / undici）。
- 不重构 OpenAPI 解析器（`src/core/parser/openApiParser`、`templateParser`）的核心算法，仅扩展输入/输出字段。

---

## 2. 影响面与现状映射

| 模块          | 现状路径                                                                       | 本次变更                                                                            |
| ------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 配置类型      | `packages/wormhole/src/helper/config/type.ts`（`GeneratorConfig` L130-269）    | 新增/修改字段；移除 `fileNameCase`；移除 `autoUpdate`（迁移至 VSCode 扩展）         |
| 配置 zod 校验 | `packages/wormhole/src/helper/config/zType.ts`                                 | 同步类型变更；移除 `autoUpdate` schema                                              |
| 配置加载      | `packages/wormhole/src/readConfig.ts`、`helper/config/ConfigHelper.ts`         | 新增 `.alovarc` 解析；缓存路径迁移；移除 `getAutoUpdateConfig`                      |
| 模板预设入口  | `packages/wormhole/src/template/index.ts`                                      | 增加 `functional`、补全 `axios/fetch/ky`、保留 `alovaGlobals`                       |
| 模板文件      | `packages/wormhole/src/template/presets/*`                                     | 新增 `alova-functional/{tag}.ts.handlebars` 等；按需引入重写 axios/fetch/ky         |
| 模板引擎      | `packages/wormhole/src/helper/template/index.ts`                               | 支持 `{tag}` 文件名展开、`#` 前缀不覆盖、`partials/` 自动注册                       |
| 解析输出      | `packages/wormhole/src/core/parser/templateParser/index.ts`                    | `TemplateData` 增加 `framework`/`config` 字段 |
| 缓存          | `packages/wormhole/src/config.ts`（`alovaTempPath`）、`functions/alovaJson.ts` | 路径改为项目根目录 `.alova-cache.json`；改为单文件多 generator 结构                 |
| VSCode 扩展   | `packages/vscode-extension/ext/views/api-server.ts` 等                         | 适配新缓存文件路径与结构；接管 `autoUpdate` 逻辑                                    |
| AI 文档插件   | 新增 `packages/wormhole/src/plugins/presets/aiDoc/`                            | 提供 `aiDoc` 插件、Skill 模板预设（模板内容改为英文）                               |
| CLI           | `packages/wormhole/src/bin/{cli,actions}.ts`                                   | 参数重构：`-c/--cwd` → `-p/--project`；移除 `-w`；默认 workspace 模式；加错误处理   |
| 移除          | `fileNameCase`（实测代码中未实际存在该字段）                                   | 在文档/类型/zod schema 中确保不会出现；保留兼容性提示                               |
| 移除          | `autoUpdate`（`Config` 根配置项）                                              | 从 wormhole 核心库移除；由 VSCode 扩展自行管理自动更新逻辑                          |

---

## 3. 配置规格

### 3.1 `defineConfig` 完整字段 ✅

新增/修改的 `GeneratorConfig` 字段：

| 字段                | 类型                              | 默认                                              | 说明                                      | 状态 |
| ------------------- | --------------------------------- | ------------------------------------------------- | ----------------------------------------- | ---- |
| `input`             | `string \| string[]`              | 必填                                              | 支持数组时依次尝试，返回第一个成功的结果   | ✅   |
| `docComment`        | `boolean`                         | `true`                                            | 关闭后跳过 JSDoc 生成，提升大文档生成性能 | ✅   |
| `responseMediaType` | `string \| string[]`              | `'application/json'`                              | 数组表示按顺序回退匹配                    | ✅   |
| `bodyMediaType`     | `string \| string[]`              | `'application/json'`                              | 同上                                      | ✅   |
| `serverName`        | `string`                          | `info.title` 或 `output` 路径                     | IDE 侧边栏、Skill 文档分组名              | ✅   |
| `template`          | `TemplateConfig`（同步/异步函数） | 必填（若未提供则报错并指引使用 `alovaGlobals()`） | 见 §3.2                                   | ✅   |

被移除字段：`fileNameCase` ✅、`autoUpdate` ✅（含 `getAutoUpdateConfig` 导出函数）、`platform` ✅（改为 `platform` 插件）。

### 3.1.1 `input` 支持 `string[]` ✅

`config.input` 现在支持 `string | string[]`。当设置为数组时，将依次访问每个 URL，返回第一个成功返回的数据，不再继续尝试后续 URL。此功能可用于：
- 主备服务器切换
- 多格式 OpenAPI 文件尝试（如先尝试 OAS3 再尝试 Swagger2）
- 配合 `platform` 插件自动生成多个候选 URL

### 3.2 `template` 配置形态 ✅

模板不再通过 `GeneratorConfig.template` 配置项指定。改为通过插件（plugin）的 `getTemplate` hook 返回模板路径（`TemplateConfigResult`），多插件有返回 template 时以最后一个有效的返回值为准。

```ts
// 插件 getTemplate hook 返回的模板路径
interface TemplateConfigResult {
  /** 模板路径，相对则相对于 process.cwd() */
  path: string;
}
```

模板配置参数通过插件的 `beforeCodeGenerate` hook 注入到 `templateData.config` 中，无需在 `TemplateConfigResult` 中携带。

预设模板插件签名（`@alova/wormhole/plugin`）：

```ts
export function alova(opts?: FunctionalOptions): ApiPlugin;
export function alovaGlobals(opts?: AlovaGlobalsOptions): ApiPlugin;
export function axios(opts?: RequestLibOptions): ApiPlugin;
export function fetch(opts?: RequestLibOptions): ApiPlugin;
export function ky(opts?: RequestLibOptions): ApiPlugin;
```

`AlovaGlobalsOptions`：保留现有 `global` / `globalHost` / `useImportType`，**移除 `version`**（仅生成 alova v3）。
`FunctionalOptions` / `RequestLibOptions`：起步包含 `useImportType?: boolean`，预留扩展。

### 3.3 `.alovarc` 极简配置 ✅

文件位置：项目根目录 `.alovarc`（与 `package.json` 同级）。

语法：

- 一行一条 generator；空行忽略。
- `#` 起始行为整行注释；行尾允许 `// ...` 风格注释。
- 形态：`[<key>=]<input>[, <templatePreset>]`
  - `<key>` 可选，作为输出目录名；未提供时按规则推导（首条 → `src/api`，后续 → `src/api2` … `src/apiN`）。
  - `<key>` 包含 `/` 时按相对路径直接用作 `output`。
  - `<templatePreset>` 可选，取值 `alova` (= `alovaGlobals`) / `functional` / `axios` / `fetch` / `ky`，缺省为 `alovaGlobals`。

解析结果转换为等价的 `defineConfig` generator 数组，与 `alova.config.{ts,js}` 互斥（同时存在则 JS/TS 优先并打印警告）。

---

## 4. 模板机制规格 ✅

### 4.1 目录约定 ✅

模板根目录可包含模块类型子目录：

```
<template-root>/
  typescript/   # 当 type=ts/typescript 时使用
  module/       # 当 type=module 时使用
  common/       # 当 type=commonjs 时使用
  partials/     # 自动注册为 handlebars partial
```

- 模板根目录**不存在**任意一种 `typescript/module/common` 子目录时，**整个根目录**作为目标模板（兼容自定义最简模板）。
- 模板可以只提供**部分**模块类型目录（例如 `ky` 预设仅有 `typescript/` 和 `module/`，不含 `common/`）。当用户请求的 `type` 对应目录不存在时，框架抛出包含模板名和受支持类型列表的错误，例如：`Template "ky" does not support module type "commonjs". Supported types: typescript, module`。
- `type='auto'` 行为不变：依据项目 `tsconfig.json`、`package.json#type` 推导。

### 4.2 文件名约定 ✅

| 形态                                   | 含义                                                                                                                                                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name.ext.handlebars` / `name.ext.hbs` | 普通模板，渲染时去掉 `.handlebars` / `.hbs` 扩展                                                                                                                                                |
| `{tag}.ext.handlebars`                 | 按 tag 展开：遍历 `tagedApis`，每个 tag 渲染一份；文件名以预处理后的 tag 替换（保持现有去中文逻辑）；模板中可访问 `currentTag` 对象（类型为 `ApiDoc`），通过 `currentTag.tagName` 访问 tag 名称 |
| `{api}.ext.handlebars`                 | 按 api 展开：遍历 `allApis`，每个 api 渲染一份；文件名以 api 的 name 字段替换；模板中可访问 `currentApi` 对象（类型为 `Api`）                                                                   |
| `#name.ext.handlebars`                 | 不覆盖：仅当目标文件不存在时生成；输出时去掉 `#`                                                                                                                                                |
| `partials/<x>.handlebars`              | 注册为 partial，可在其他模板中 `{{> x}}` 引用                                                                                                                                                   |

输出目录结构与模板目录结构完全镜像（去除模块类型子目录层级）。

### 4.3 模板渲染参数 ✅

`TemplateData`（强制）：

```ts
interface TemplateData {
  title: string;
  openapi: string;
  version: string;
  description?: string;
  contact?: OpenAPIContact;
  framework?: "vue" | "react" | "svelte" | "solid-js" | "nuxt";
  defaultKey?: boolean;
  baseUrl: string;
  components: string[]; // schema 类型字符串
  apis: Api[]; // 扁平
  tagedApis: ApiDoc[]; // 按 tag 分组
  type: "typescript" | "module" | "commonjs";
  config: Record<string, unknown>; // template() 返回的 config 透传
}

interface Api {
  tag: string;
  method: string;
  summary: string;
  path: string;
  pathParameters: string;
  queryParameters: string;
  pathParametersComment?: string;
  queryParametersComment?: string;
  responseComment?: string;
  requestComment?: string;
  name: string;
  responseName: string;
  requestName?: string;
  defaultValue?: string;
  pathKey: string;
}

interface ApiDoc {
  apis: Api[];
  /** 分组名称（原 tag 字段更名为 tagName） */
  tagName: string;
}
```

### 4.4 Handlebars helper 增量 ✅

需在 `helper/template` 中注册：

| Helper                         | 用途                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| `eq a b`                       | 框架/类型分支判断                                                           |
| `or a b ...`                   | 多参数任一为真                                                              |
| `and a b ...`                  | 多参数全部为真                                                              |

---

## 5. 内置模板规格 ✅

### 5.1 `functional`（按需引入，alova v3） ✅

目录：`src/template/presets/alova-functional/typescript/`

- `index.ts.handlebars`：创建 `alovaInstance`、按 framework 注入 statesHook、`export *` 重导出每个 tag 模块。
- `{tag}.ts.handlebars`：每个 API 一个具名函数；`pathParameters` 走 `config.pathParams`；返回 `Method` 实例。
- `types.ts.handlebars`：使用 `{{#each components}}` 展开类型声明（修正旧 `{{#schemas}}` 字段名问题）。
- **必须** `import { alovaInstance } from './index'`（值导入，禁止 `import type`）。
- **不得** 包含 `createApis.ts.handlebars`。

### 5.2 `alovaGlobals` ✅

保留原现有 `alova-globals/{typescript,module,common}/` 模板与 partials；移除 v2 相关分支。`global` 参数会拼接在每个 API 的 `pathKey` 和 `defaultValue` 最前面（如 `Apis.pet.addPet`），以确保全局引用路径正确。

### 5.3 `axios` / `fetch` / `ky` ✅

按 §5.1 同样的按需引入模式重写：每套模板 `{ index, {tag}, types }` 三个文件。

- `axios`：导出 `axiosInstance`，每个 API 返回 `axiosInstance({...})`。
- `fetch`：导出 `BASE_URL`，使用原生 `fetch`，自动拼接 `URLSearchParams`。
- `ky`：导出 `kyInstance = ky.create({ prefixUrl })`，每个 API 调 `kyInstance(path,...).json()`。

### 5.4 通用要求 ✅

- 所有按需模板**必须**支持 tree-shaking（独立具名 export，无运行时 side-effect 注册）。
- 函数签名统一以单参数 `config` 形式呈现，`pathParams` / `params` / `data` 通过类型交叉添加。
- 当 `pathParameters` 不存在时不生成解析逻辑，避免无用代码。

---

## 6. AI Skill 引入方式展示 ✅

### 6.1 设计原则

AI Skill 文档中不再使用 `importDescriptor` 解析 jsconfig/tsconfig 的路径别名。改为在每个 API 文档中展示文件所在位置（`fileLocation`），由 aiDoc 插件在 `codeGenerated` 中计算并注入到模板渲染数据中。

### 6.2 实现方式

aiDoc 插件在 `codeGenerated` 中为每个 API 计算 `fileLocation` 字段（API 所在文件的相对路径），将其注入到模板渲染上下文中。模板通过 `{{fileLocation}}` 直接展示文件位置，无需 `renderImport` helper。

### 6.3 与旧设计对比

| 维度 | 旧设计 (importDescriptor) | 新设计 (fileLocation) |
|------|--------------------------|----------------------|
| 路径解析 | 读取 jsconfig/tsconfig paths 别名 | 不解析，直接展示文件位置 |
| 渲染方式 | `renderImport` helper 生成 import 语句 | 直接展示 `{{fileLocation}}` |
| 模板依赖 | 依赖 `ImportDescriptor` 类型 | 无额外类型依赖 |
| 可维护性 | 需维护路径别名解析逻辑 | 简洁直接 |

---

## 7. 缓存文件规格 ✅

### 7.1 路径 ✅

- 旧：`<projectRoot>/node_modules/.alova/<output_with_underscores>_api.json`
- 新：`<projectRoot>/.alova-cache.json`（单文件，**应被纳入版本控制**）

### 7.2 结构 ✅

```ts
interface AlovaCacheEntry {
  path: string; // generator output（相对于项目根）
  serverName: string; // 显示名
  apis: ApiDoc[]; // 与 TemplateData.tagedApis 同结构
}
type AlovaCacheFile = AlovaCacheEntry[];
```

写入策略：每次 generate 完成后，合并/覆盖对应 `path` 条目；按 `path` 字典序稳定排序，方便 diff。

### 7.3 内存缓存 ✅

保留 `globalThis.ALOVA_WORMHOLE_CONFIG.templateData: Map<string, TemplateData>`，键改为 generator 的 `output` 绝对路径。

### 7.4 兼容 ✅

- 启动时检测旧 `node_modules/.alova/*_api.json`：若存在且新缓存文件不存在，则一次性迁移，迁移后删除旧目录并打印日志。
- VSCode 扩展更新读取逻辑（`packages/vscode-extension/ext/functions/getApiDocs` 路径），保持类型不变。

---

## 8. AI Skill 插件（`aiDoc`） ✅

### 8.1 API ✅

```ts
import { aiDoc } from '@alova/wormhole/plugin';

const plugin = aiDoc({
  template?: string;            // 自定义 skill 模板路径，默认内置
  outputDir?: string;           // 默认 '<output>/aidocs'
});
```

### 8.2 工作流 ✅

1. 在 `codeGenerated` 钩子触发。
2. 为每个 API 计算 `fileLocation`（文件所在位置的相对路径），注入到模板渲染数据中。
3. 使用内置 / 用户提供的 handlebars 模板渲染：
   - `SKILL.md`（一份，含目录、按 `serverName` 分组的链接，通过 `{{#each allApis}}` 列出每个 API）。
   - `references/<api>.md`（每个 API 一份，通过 `{api}` 模板遍历 `allApis` 生成，内含单个 API 的文档段落，模板中通过 `currentApi` 访问当前 API 对象）。
4. 渲染上下文 = `TemplateData` + `serverName` + `fileLocation`。

### 8.3 内置 Skill 模板 ✅

- 位置：`packages/wormhole/src/template/presets/ai-doc/`。
- 文件：`SKILL.md.handlebars`、`references/{api}.md.handlebars`（`{api}` 由模板引擎展开，每个 API 生成一个文件，模板中通过 `currentApi` 访问当前 API）。
- **模板内容全部使用英文**，包括说明文字、章节标题、用法说明等。

### 8.4 文档内容关键点 ✅

- Skill 头部 `frontmatter` 必含 `name` / `description`；`description` 由 `info.description` + serverName 组装。
- 每篇 API 文档必须包含：
  - 接口标题（`summary`）
  - **使用约定**段（强制声明请求库、引入方式）
  - `Path Parameters` / `Request Body` / `Response` 三段（仅在存在时输出）
  - **调用示例**段：展示 API 的文件位置信息和示例代码

---

## 8.5 插件系统改进 ✅

### 8.5.1 Hook 命名规范 ✅

将 `afterXxx` 形式重命名为过去式 `xxxed`：

| 旧名称              | 新名称          |
| ------------------- | --------------- |
| `afterOpenapiParse` | `openapiParsed` |
| `afterCodeGenerate` | `codeGenerated` |

`beforeOpenapiParse` 和 `beforeCodeGenerate` 保持不变。

### 8.5.2 Hook 参数对象化 ✅

所有 hook 参数统一为单一对象参数，以便后续扩展：

```ts
/**
 * Function injected into plugin hooks for reporting plugin-scoped progress.
 */
export type ReportProgress = (progress: number, message?: string) => void;

interface ApiPlugin {
  name?: string;

  config?: (params: {
    config: GeneratorConfig;
    projectPath: string;
    reportProgress: ReportProgress;
  }) => MaybePromise<GeneratorConfig | undefined | null | void>;

  beforeOpenapiParse?: (params: {
    config: Readonly<GeneratorConfig>;
    projectPath: string;
    reportProgress: ReportProgress;
  }) => void;

  openapiParsed?: (params: {
    config: Readonly<GeneratorConfig>;
    document: OpenAPIDocument;
    projectPath: string;
    reportProgress: ReportProgress;
  }) => MaybePromise<OpenAPIDocument | undefined | null | void>;

  beforeCodeGenerate?: (params: {
    config: Readonly<GeneratorConfig>;
    data: TemplateData;
    projectPath: string;
    reportProgress: ReportProgress;
  }) => MaybePromise<string | undefined | null | void>;

  codeGenerated?: (params: {
    config: Readonly<GeneratorConfig>;
    data: TemplateData;
    files: Record<string, string>;
    projectPath: string;
    error?: Error;
    reportProgress: ReportProgress;
  }) => MaybePromise<void>;
}
```

### 8.5.3 Config 冻结策略与 projectPath ✅

| Hook                        | config 状态                        | projectPath  |
| --------------------------- | ---------------------------------- | ------------ |
| `config`                    | 可修改（原始对象）                 | 当前项目路径 |
| `beforeOpenapiParse` 及之后 | `Object.freeze()` 冻结，防止误修改 | 当前项目路径 |

所有 hook 均接收 `projectPath: string` 参数，表示当前正在处理的项目目录路径。

### 8.5.4 `codeGenerated` 文件修改 ✅

`codeGenerated` hook 接收 `files: Record<string, string>` 参数（key=文件相对路径，value=文件内容）。插件可直接修改此对象。

生成流程调整：

1. 模板渲染生成文件内容到内存中的 `files` 对象
2. 调用 `codeGenerated` hook，插件可修改 `files`
3. 将最终的 `files` 内容写入磁盘

### 8.5.5 影响的文件 ✅

- `packages/wormhole/src/helper/config/type.ts`：`ApiPlugin` 接口重写
- `packages/wormhole/src/helper/config/zType.ts`：zod schema 同步
- `packages/wormhole/src/helper/PluginDriver.ts`：无变化（通用调度器）
- `packages/wormhole/src/helper/config/GeneratorHelper.ts`：调用点适配新参数
- `packages/wormhole/src/helper/template/index.ts`：`generateFromTemplateDir` 返回 `files` 对象
- `packages/wormhole/src/plugins/presets/*`：所有预设插件适配新签名

---

## 8.6 生成进度上报 ✅

### 8.6.1 目标 ✅

在不破坏现有 API 的前提下，让 `generate()` 能够把核心生成阶段及插件钩子内部的进度通过统一通道暴露给调用方（CLI / IDE 扩展 / Web 集成），并在 CLI 中以多行可读格式展示。

### 8.6.2 类型契约 ✅

`packages/wormhole/src/helper/config/type.ts` 新增：

```ts
export interface GenerateProgress {
  /** 'core' 表示核心生成流程；其他值为插件 name */
  source: string;
  /** 0-100 整数百分比（越界自动 clamp） */
  progress: number;
  /** 可选状态文案 */
  message?: string;
}

export type ReportProgress = (progress: number, message?: string) => void;
```

5 个 hook 参数接口（`ConfigHookParams` / `BeforeOpenapiParseHookParams` / `OpenapiParsedHookParams` / `BeforeCodeGenerateHookParams` / `CodeGeneratedHookParams`）统一新增 `reportProgress: ReportProgress` 字段。

`packages/wormhole/src/type/lib.ts` 中 `GenerateApiOptions` 扩展：

```ts
export interface GenerateApiOptions {
  force?: boolean;
  projectPath?: string;
  onProgress?: (snapshot: Record<string, GenerateProgress>) => void;
  /** 默认 500ms；<= 0 时不节流，每次 update 立刻 flush */
  progressInterval?: number;
}
```

### 8.6.3 ProgressTracker ✅

新建 `packages/wormhole/src/helper/progress.ts`，导出 `ProgressTracker` 与常量 `CORE_PROGRESS_SOURCE = 'core'`、空操作 `noopReportProgress`。

```ts
export class ProgressTracker {
  constructor(
    listener?: (s: Record<string, GenerateProgress>) => void,
    interval = 500
  );
  start(): void; // 启动节流定时器
  stop(): void; // 停止并 flush 最后一次
  update(source: string, progress: number, message?: string): void;
  flush(): void; // 立即触发一次 listener
  reporterFor(source: string): ReportProgress; // 绑定 source 的便捷方法
}
```

要点：

- 内部维护 `Record<source, GenerateProgress>` 快照与 `dirty` 标记，listener 仅在 dirty 时触发。
- `interval <= 0` 时不启动定时器，每次 `update` 内部直接 `flush`。
- `stop()` 必然 flush 一次，保证终态被推送。
- 进度值在 `[0, 100]` 范围内 clamp。

### 8.6.4 PluginDriver 扩展 ✅

`packages/wormhole/src/helper/PluginDriver.ts` 新增两个按插件构造参数的重载，保留旧 `hookSeq` / `hookParallel` 不变以避免无关回归：

```ts
hookParallelEach<H, P>(name: H, makeArgs: (plugin: ApiPlugin) => Parameters<P>): Promise<void>
hookSeqEach<H, P>(
  name: H,
  makeArgs: (plugin: ApiPlugin, prevResult: Awaited<ReturnType<P>> | undefined) => Parameters<P>,
): Promise<ReturnType<P> | undefined>
```

这两个方法允许调用方为每个插件构造独立参数（如 `reportProgress: tracker.reporterFor(plugin.name ?? 'plugin')`），并保持原有 seq/parallel 语义。

### 8.6.5 核心阶段锚点 ✅

`GeneratorHelper.generate(config, { projectPath, force, tracker })` 内部按以下百分比对 source = `'core'` 上报：

| %   | 阶段                               |
| --- | ---------------------------------- |
| 5   | starting                           |
| 10  | beforeOpenapiParse                 |
| 20  | parsing openapi document           |
| 35  | openapi parsed                     |
| 45  | openapiParsed (after plugin chain) |
| 55  | template configuration loaded      |
| 65  | template data parsed               |
| 70  | beforeCodeGenerate                 |
| 80  | processing templates               |
| 90  | template generation completed      |
| 95  | writing files                      |
| 100 | completed                          |

跳过 / 失败路径同样上报 `100`，消息分别为 `skipped: <reason>` / `failed: <error.message>`。`tracker` 不存在时，所有上报降级为 noop（不 throw、不分配快照对象）。

### 8.6.6 数据流 ✅

```
generate(config, options)
  └─ new ProgressTracker(options.onProgress, options.progressInterval ?? 500)
       └─ tracker.start()
            └─ configHelper.load(..., tracker)
                  └─ configManager.load → handleConfig → prepareConfig(item, projectPath, tracker)
                       └─ pluginDriver.hookSeqEach('config', plugin => [{ ..., reportProgress: tracker.reporterFor(plugin.name) }])
            └─ configHelper.generate({ force, tracker })
                  └─ GeneratorHelper.generate(item, { projectPath, force, tracker })
                       ├─ core stage updates
                       └─ pluginDriver.hookParallelEach / hookSeqEach 注入 reportProgress
       └─ tracker.stop() (always, in finally)
```

### 8.6.7 CLI 集成 ✅

CLI 渲染逻辑独立到 `packages/wormhole/src/bin/progressRenderer.ts`，导出：

- `formatProgressBar(progress, width = 20)` — 单行 bar 字符串
- `sortProgressEntries(snapshot)` — `core` 优先，插件按 name 字典序
- `renderProgressSnapshot(snapshot, options)` — 整体多行字符串
- `createProgressRenderer(header, options?)` — 绑定固定 header 的 stateful renderer，便于 spinner 复用

`bin/actions.ts` 中 `generateForProject` 通过 `createProgressRenderer(header)` 得到一个回调，把 `ora` spinner 文本随 `onProgress` 同步刷新。

### 8.6.8 影响的文件 ✅

- 新增：`packages/wormhole/src/helper/progress.ts`、`packages/wormhole/src/bin/progressRenderer.ts`
- 修改：
  - `packages/wormhole/src/type/lib.ts`
  - `packages/wormhole/src/helper/config/type.ts`
  - `packages/wormhole/src/helper/index.ts`
  - `packages/wormhole/src/helper/PluginDriver.ts`
  - `packages/wormhole/src/functions/prepareConfig.ts`
  - `packages/wormhole/src/helper/config/ConfigManager.ts`
  - `packages/wormhole/src/helper/config/ConfigHelper.ts`
  - `packages/wormhole/src/helper/config/GeneratorHelper.ts`
  - `packages/wormhole/src/generate.ts`
  - `packages/wormhole/src/bin/actions.ts`

### 8.6.9 验证 ✅

- `packages/wormhole/test/progress.spec.ts`：`ProgressTracker` 节流 / clamp / stop 终态 / 立刻模式（interval ≤ 0）。
- `packages/wormhole/test/progressRenderer.spec.ts`：bar 字符宽度、core 排序优先、消息留白、空快照。
- `packages/wormhole/test/pluginDriverEach.spec.ts`：`hookParallelEach` / `hookSeqEach` 注入参数。
- `packages/wormhole/test/generates/*` 中已有 e2e 流程加入 progress 断言（核心终态必为 100）。

---

## 8.7 平台插件（`platform`） ✅

### 8.7.1 API ✅

```ts
import { platform } from '@alova/wormhole/plugin';

const plugin = platform('swagger');
```

使用示例：

```ts
defineConfig({
  generator: [{
    input: 'https://petstore3.swagger.io',
    plugins: [platform('swagger'), alovaGlobals()],
    output: './src/api',
  }]
});
```

### 8.7.2 行为 ✅

`platform` 插件通过 `config` hook 修改 `config.input`：
1. 接收用户传入的平台类型字符串（`'swagger' | 'knife4j' | 'fastapi' | 'yapi'`）
2. 从 `config.input` 读取 API 文档项目 URL
3. 根据平台类型自动拼接生成 OpenAPI 文件 URL 数组
4. 将数组赋值给 `config.input`

| 平台类型 | 生成的 input 数组 |
|----------|-------------------|
| `'swagger'` | `['<input>/api/v3/openapi.json', '<input>/v2/swagger.json', '<input>/openapi.json']` |
| `'knife4j'` | `['<input>/v3/api-docs', '<input>/v2/api-docs']` |
| `'fastapi'` | `['<input>/openapi.json']` |
| `'yapi'` | `['<input>']`（需包含 pid/token 参数） |

### 8.7.3 内部实现 ✅

- 创建文件 `packages/wormhole/src/plugins/presets/platform.ts`
- 从 `plugins/index.ts` 导出
- 在 `PluginName` 枚举中添加 `PLATFORM = 'platform'`

---

## 9. 公共 API & 包导出 ✅

`@alova/wormhole` 顶层导出（保持向后兼容）：

- `defineConfig`、`generate`、`readConfig`、`createConfig`、`setGlobalConfig`、`resolveWorkspaces`。

新增子路径导出（`package.json#exports`）：

- `@alova/wormhole/plugin` → 现有 `rename`、`apifox`、`importType`、`filterApi`、`tagModifier`、`payloadModifier`、**新增 `aiDoc`**、**新增模板预设插件 `alova`、`alovaGlobals`、`axios`、`fetch`、`ky`**、**新增 `platform`**。

### 9.1 `importType` 插件规格 ✅

函数签名：

```ts
function importType(
  imports: Record<string, string[]>,
  options?: { files?: string[] }
): ApiPlugin;
```

**参数**：

| 参数            | 类型                       | 说明                                                                         |
| --------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `imports`       | `Record<string, string[]>` | key 为模块路径（支持 `\|type` 后缀标记 `import type`），value 为类型名称数组 |
| `options.files` | `string[]`                 | 目标文件名匹配列表，默认 `['globals.d']`                                     |

**key 格式**：`<specifier>[|type]`

- `'module-name'`：生成 `import { ... } from 'module-name'`
- `'module-name|type'`：生成 `import type { ... } from 'module-name'`

**行为**：

1. `config` hook：将所有 value 中的类型名称合并去重后追加到 `config.externalTypes`
2. `codeGenerated` hook：遍历 `files`，对文件路径中包含 `options.files` 任一匹配项的文件，在顶部块注释之后插入 import 语句

**示例**：

```ts
importType(
  {
    "my-types|type": ["Pagination", "BaseResponse"],
    "@/shared": ["File", "FormData"],
  },
  { files: ["globals.d", "types"] }
);
```

生成结果：

```ts
import type { Pagination, BaseResponse } from "my-types";
import { File, FormData } from "@/shared";
```

---

## 10. CLI 规格 ✅

### 10.1 命令与参数 ✅

```
alova init [-t, --type <type>] [-T, --template <template>] [-p, --project <path>]
alova gen  [-f, --force] [-p, --project <path>]
```

| 命令   | 参数                        | 类型      | 说明                                                                                              |
| ------ | --------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `init` | `-t, --type <type>`         | `string`  | 配置文件类型，通过 `.choices()` 限定：`typescript` / `ts` / `commonjs` / `module`                 |
| `init` | `-T, --template <template>` | `string`  | 模板预设，通过 `.choices()` 限定：`alova` / `functional` / `axios` / `fetch` / `ky`，默认 `alova` |
| `init` | `-p, --project <path>`      | `string`  | 项目目录（alova.config 所在目录），缺省为 `process.cwd()`                                         |
| `gen`  | `-f, --force`               | `boolean` | 强制重新生成，忽略缓存                                                                            |
| `gen`  | `-p, --project <path>`      | `string`  | 指定项目目录；传入时为**单项目模式**，未传入时为**workspace 模式**                                |

### 10.2 `gen` 命令行为 ✅

| 模式          | 触发条件          | 行为                                                                            |
| ------------- | ----------------- | ------------------------------------------------------------------------------- |
| **workspace** | 未传 `-p`（默认） | 调用 `resolveWorkspaces()` 扫描所有子项目，逐一读取配置并生成                   |
| **单项目**    | 传入 `-p <path>`  | 仅对指定目录调用 `readConfig(path)` + `generate(config, { projectPath: path })` |

workspace 模式下若 `resolveWorkspaces()` 返回空数组，打印错误信息并以非零码退出。

### 10.3 错误处理 ✅

- `actionInit` 与 `actionGen` 内部使用 try/catch 包裹核心逻辑。
- 异常时调用 `spinner.fail(message)` 输出错误摘要，然后 `process.exit(1)`。
- 成功/失败提示使用实际项目路径（如 `./packages/app`），而非 `undefined`。

### 10.4 与旧版差异 ✅

| 旧版                        | 新版                          | 说明                                         |
| --------------------------- | ----------------------------- | -------------------------------------------- |
| `-c, --cwd <path>`          | `-p, --project <path>`        | 避免与 `--config` 惯例冲突，语义更清晰       |
| `-w, --workspace`           | 移除                          | workspace 为默认行为，无需显式 flag          |
| `workspace` 参数默认 `true` | 由 `-p` 是否传入决定          | 逻辑更直观：有 `-p` 则单项目，无则 workspace |
| `--type` 无校验             | `.choices([...])` CLI 层校验  | 拼写错误立即报错                             |
| 无 try/catch                | 包裹 try/catch + spinner.fail | 异常时不再卡死 spinner                       |

### 10.5 实现文件 ✅

- `packages/wormhole/src/bin/cli.ts`：命令注册、参数定义
- `packages/wormhole/src/bin/actions.ts`：`actionInit`、`actionGen` 实现
- `packages/wormhole/test/cli.spec.ts`：CLI 单元测试

---

## 11. 迁移 & 不兼容变更（Breaking）

| 变更                                                  | 等级                                        | 迁移指引                                                                      |
| ----------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| 缓存路径迁移                                          | minor（自动迁移）                           | 首次 generate 自动迁移并提示加入版本控制                                      |
| 移除 alova v2 支持                                    | **breaking**                                | 仍需 v2 的用户停留在 wormhole@1                                               |
| 移除 `fileNameCase` 字段（若用户曾使用）              | **breaking**                                | 配置中删除即可，校验时仅 warning                                              |
| 移除 `autoUpdate` 字段（`Config` 根配置项）           | **breaking**                                | 从 `alova.config.*` 中删除 `autoUpdate` 配置；自动更新逻辑由 VSCode 扩展接管  |
| 移除 `getAutoUpdateConfig` 导出函数                   | **breaking**                                | 若调用方依赖此函数，改由 VSCode 扩展内部实现或不再使用                        |
| `template` 由字符串/枚举改为函数返回 `TemplateConfig` | **breaking**                                | 提供 codemod 或文档指引：`template: 'globals'` → `template: alovaGlobals()`   |
| 全局对象 `Apis` 不再默认存在                          | **breaking**（仅当切换到非 globals 模板时） | 文档说明并提供 `alovaGlobals` 兼容路径                                        |
| CLI 参数 `-c/--cwd` → `-p/--project`，移除 `-w`       | **breaking**                                | 更新脚本中的 `alova gen -c` → `alova gen -p`；`-w` 已为默认行为，直接删除即可 |
| 移除 `platform` 参数，改为 `platform` 插件            | **breaking**                                | 将 `platform: 'swagger'` 替换为 `plugins: [platform('<url>'), ...]`           |
| `input` 类型从 `string` 改为 `string \| string[]`     | **breaking**（源码类型）                    | 对绝大多数用户无影响（string 仍然可用）；数组中 URL 依次尝试返回首个成功结果 |

需要在 `CHANGELOG.md` + `.changeset/` 增加 major bump。

---

## 12. 风险 & 待决策

- **R2 AI Skill 输出粒度**：已决定采用「每 tag 一个 md」方案，文件为 `references/{tag}.md`，内含该 tag 所有 API 文档段落，与 `{tag}.md.handlebars` 模板文件名一致。
- **R3 路径解析的鲁棒性**：不再依赖 tsconfig/jsconfig 路径别名解析。AI Skill 文档直接展示文件位置（`fileLocation`），简洁可靠。
- **R4 `.alovarc` 与 JS/TS 配置共存策略**：当前规格选择 JS/TS 优先；需在 README 显式说明。

---

## 13. 实施里程碑

| 阶段                               | 范围                                                                                 | 关键交付                  | 状态 |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------- | ---- |
| **M1 基础设施**                    | 配置类型重塑、`template()` 函数化、移除 v2/`fileNameCase`/`autoUpdate`、缓存文件迁移 | 类型 + zod + 单元测试通过 | ✅   |
| **M2 模板引擎升级**                | `{tag}` 展开、`#` 不覆盖、`partials/` 注册、helper 注入                              | 模板引擎单测；快照测试    | ✅   |
| **M3 内置模板**                    | `functional` 落地（参考实现）、按需重写 axios/fetch/ky；保留 `alovaGlobals`          | 五套预设的端到端生成测试  | ✅   |
| **M4 引入方式展示** | `fileLocation` 展示、aiDoc 模板更新                                    | 表驱动单测                | ✅   |
| **M5 AI Skill 插件**               | `aiDoc` 插件 + 内置 skill 模板（英文）                                            | 生成产物 + 文档校验       | ✅   |
| **M6 VSCode 扩展适配**             | 切换缓存读取路径 / 结构                                                              | 扩展回归测试              | 🔲   |
| **M7 文档 & 发版**                 | README、迁移指南、changeset、major release                                           | npm 发版                  | 🔲   |

每个里程碑以独立 PR 提交，关键里程碑（M1/M3/M5）需附带 e2e 用例。

---

## 14. 验收标准（DoD）

- [x] `defineConfig` 完整字段在类型与 zod 中一致，TS 严格模式编译通过。
- [x] 五套预设模板均可在测试环境生成代码（`test/templates/` 端到端测试通过）。
- [x] `.alovarc` 解析与 JS/TS 配置单测通过（`test/alovarc.spec.ts`）。
- [x] `.alova-cache.json` 在 generate 后稳定排序、可纳入 git 且 diff 可读（`test/alovaCache.spec.ts`）。
- [x] `aiDoc` 在 functional / alovaGlobals 两种模板下产出 SKILL.md 与 reference 文档，展示 fileLocation（`test/plugins/aiDoc.spec.ts`）。
- [ ] VSCode 扩展在新缓存路径下正常渲染侧边栏 + 搜索。
- [ ] 旧用户从 wormhole@1 升级仅需修改 `template` 字段即可工作（提供迁移指南文档）。
- [x] CLI `alova gen` 默认 workspace 模式正确扫描子项目；`alova gen -p <path>` 单项目模式正确生成；异常时 spinner 正确终止并输出错误信息（`test/cli.spec.ts`）。
- [x] `generate()` 在含/不含 `onProgress` 时均能正常工作；含回调时 `core` source 必有 `100` 终态；插件钩子内调用 `reportProgress` 时 snapshot 中能按插件 `name` 索引到事件（`test/generateProgress.spec.ts`、`test/progress.spec.ts`）。

---

## 15. 参考

- 提案：`./wormhole@2新特性提案.md`
- 现有实现：`packages/wormhole/src/{config,readConfig,generate}.ts`、`helper/config/{ConfigHelper,GeneratorHelper,type,zType}.ts`、`helper/template/index.ts`、`core/parser/templateParser/index.ts`、`template/presets/*`
- VSCode 扩展集成点：`packages/vscode-extension/ext/functions/getWormhole.ts`、`ext/views/api-server.ts`
