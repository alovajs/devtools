# worma@2 新特性提案

# 概述

将 worma 扩展至一个通用的 openapi 自动生成工具，利用自定义模板特性预定义 axios、fetch、ky 等请求模板，可为用户提供这些请求工具的代码生成，为广大请求工具赋能 ai skills、编辑器内嵌文档、自定义 openapi 文档能力。

# 自定义模板

## **背景**

1. 提升灵活性，实现多模板自定义切换，解决自动生成的代码 treeshaking，同时避免一个文件过多内容导致维护性差，代码冲突难解决问题。

2. 支持用户自定义模板。

3. 除了预定义 alova 模板外，额外新增 axios、fetch、ky 等模板，将 worma 的特性扩大使用范围

## **配置设计修改**

```TypeScript
import { defineConfig } from 'worma';
import { rename, globals, functional } from 'worma/plugin';

module.exports = defineConfig({
  // api生成设置数组，每项代表一个自动生成的规则，包含生成的输入输出目录、规范文件地址等等
  generator: [
    {
      // --- 新增或修改的配置项 start ---
      docComment: false, // 是否生成文档注释，默认为true，设置为false可提高生成性能

      responseMediaType: 'application/json', // 也可以设置为数组，表示依次指向的media type
      bodyMediaType: 'application/json', // 也可以设置为数组，表示依次指向的media type

      // 配置多个api文档时的自定义的serverName，用于在侧边栏展示的服务器名称，未设置时默认为当前openapi文件的info.title值，如果为空则为生成路径（例如src/api）
      serverName: 'xxxx',

      // 模板以插件（plugin）方式设置，通过 getTemplate hook 返回模板路径，通过 beforeCodeGenerate hook 注入配置参数
      // 预定义了多套模板插件：
      // 1. alova：函数式模板，生成函数式调用代码，支持treeshaking，仅支持alova3
      // 2. alovaGlobals：全局模板，现有的全局模板（支持 global/globalHost/useImportType 参数）
      // 3. axios: axios相关模板
      // 4. fetch: fetch相关模板
      // 5. ky: ky相关模板
      plugins: [alovaGlobals({
        // --- 模板参数 ---

        /**
         * 全局导出的api名称，可通过此名称全局范围访问自动生成的api，默认为`Apis`，配置了多个generator时为必填，且不可以重复
         * 此参数会拼接在每个 API 的 pathKey 和 defaultValue 最前面
         */
        global: 'Apis',

        /**
         * 全局api对象挂载的宿主对象，默认为 `globalThis`，在浏览器中代表 `window`，在nodejs中代表 `global`
         */
        globalHost: 'globalThis',
        useImportType: true,
      })],
      // --- 新增或修改的配置项 end ---
    }
  ]
});
```

## 简易模板配置

可定义\.wormarc 编写 openapi 文件地址即可快速设置，多个 openapi 文件地址可换行，\#号为单行注释

```Plain Text
# 将会在src/api文件夹下生成，默认以alova作为模板
https://xxxx.com/openapi.json

# 将会在src/api2文件夹下生成，以axios作为模板
https://yyyy.com/openapi.json, axios

# 也可以通过设置key自定义文件夹名
myApi=https://zzzz.com/openapi.json // 将会在根目录myApi文件夹下生成
public/myApi=https://zzzz.com/openapi.json  // 将会在根目录public/myApi文件夹下生成
```

## 模板机制设计

### 配置

模板不再通过`template`配置项指定，而是通过插件（plugin）的`getTemplate` hook 返回模板路径。插件可在各自的`beforeCodeGenerate`生命周期中向`templateData.config`注入配置参数。多插件有返回template时以最后一个有效的template返回值为准。

```JavaScript
// 插件通过 getTemplate hook 返回模板路径
interface TemplateConfigResult {
  // path：模板路径的字符串（基于项目根目录）用于指定应加载模板的路径（相对或绝对都可以，相对是相对于process.cwd()）
  path: string
}

// 插件接口中的 getTemplate 钩子
interface ApiPlugin {
  getTemplate?: (params: {
    config: Readonly<GeneratorConfig>
    projectPath: string
    reportProgress: ReportProgress
  }) => MaybePromise<TemplateConfigResult | undefined | null | void>
}
```

### 区分模板的模块类型

为了将模板扩展通用性，在 template 指定的路径下，可分别提供 typescript/module/common 不同模块类型的模板，然后还是根据`type`字段来区分应该选择哪一套模板（type 字段设置参数与原先保持一致），使用 handlebars 模板引擎，举例：

```Plain Text
- typescript
  - index.ts.handlebars
  - index.d.ts.handlebars
- module
  - index.mjs.handlebars
  - index.d.ts.handlebars
- common
  - index.cjs.handlebars
  - index.d.cts.handlebars
```

根据 type 值来选择对应的模板，type 值依然支持`auto`。模板可以只提供部分模块类型目录（例如只有 `typescript/` 和 `module/`，没有 `common/`），此时若用户请求了不存在的模块类型，工具将抛出明确的错误信息，列出该模板实际支持的类型，例如：

```
Template "ky" does not support module type "commonjs". Supported types: typescript, module
```

如果自定义模板没有进行区分模块类型，则将 template 路径下的都当作目标模板来生成，举例：

```Plain Text
- folder-A
  - #index.ts.handlebars
  - index.d.ts.handlebars
- folder-B
  - index.ts.handlebars
  - index.d.ts.handlebars
```

此时以上两个文件夹都当作目标模板来生成。

> 值得注意的是，生成时，生成代码的文件结构保持与模板文件结构一致。

### 支持 partial 引入

模板根目录下 partials 文件夹内的模块自动被注册为 partial，可通过文件名进行引入，例如：

```TypeScript
- partials
  - partial1.handlebars
- folder-A
  - index.ts.handlebars
```

在`folder-A/index.ts.handlebars`中可通过\{\{\> partial1\}\}引用。

### 文件生成规则

在之前的版本中，固定生成 index\.ts、globals\.d\.ts、apiDefinitions 等文件，在本次版本中需要升级为可自定义生成文件：

1. 按 tag 名区分文件：文件名可指定为`{tag}`（例如`{tag}.js`），生成文件时将遍历 openapi 文件中的 tag，然后生成对应个数的文件，将`{tag}`替换为对应的实际 tag，不包含中括号。这些 tag 会被预处理成不包含中文的文本（在当前版本中已实现）。在`{tag}`模板中可访问`currentTag`对象（类型为`ApiDoc`），通过`currentTag.tagName`访问当前tag名称，通过`currentTag.apis`访问当前tag下的接口列表。模板数据中不再单独包含`currentTag`字符串字段。

2. 按 api 名区分文件：文件名可指定为`{api}`（例如`{api}.ts`），生成文件时将遍历`allApis`数组，然后生成对应个数的文件，将`{api}`替换为对应的接口名称。在`{api}`模板中可访问`currentApi`对象（类型为`Api`），代表当前遍历到的接口对象。

### 不可覆盖的文件

可在文件名称前添加一个`#`，表示文件不覆盖，与当前的`index.ts`生成逻辑相同。例如`#index.ts`文件生成时会检查是否已存在，不存在才生成，在生成后，对应的文件名需要去掉`#`号。

例如，上面模板中的`folder-A/#index.ts`，在生成时将会检查`folder-A/index.ts`是否存在，存在则不生成，不存在则生成，没有`#`号则在每次生成都覆盖处理。

### 模板参数

每个模板在生成时，都将会接收到以下模板参数，这是一个标准化的模板渲染参数设计：

```TypeScript
interface Api {
  tag: string
  method: string
  summary: string
  path: string
  pathParameters: string
  queryParameters: string
  pathParametersComment?: string
  queryParametersComment?: string
  responseComment?: string
  requestComment?: string
  name: string
  responseName: string
  requestName?: string
  defaultValue?: string
  pathKey: string
}

interface ApiDoc {
  apis: Api[]
  /** 分组名称（原 tag 字段更名为 tagName） */
  tagName: string
}

interface TemplateData {
  title: OpenAPIDocument['info']['title']
  openapi: OpenAPIDocument['openapi']
  version: OpenAPIDocument['info']['version']
  description: OpenAPIDocument['info']['description']
  contact: OpenAPIDocument['info']['contact']
  /** Framework tag: vue | react | svelte | solid-js | nuxt */
  framework?: string
  defaultKey?: boolean
  baseUrl: string
  /** Schema/Component definitions */
  components: string[]
  /** All apis array */
  apis: Api[]
  /** Apis grouped by tag */
  tagedApis: ApiDoc[]
  type: 'typescript' | 'module' | 'commonjs'
  /** Config 由插件通过 beforeCodeGenerate hook 注入，透传到模板渲染上下文 */
  config: Record<string, any>
}
```

> **注意**：`Api` 不再包含 `importDescriptor` 字段。AI Skill 文档中改为展示文件所在位置（`fileLocation`），由 aiDoc 插件在 `codeGenerated` 中计算并注入到模板渲染数据中，不再依赖 jsconfig/tsconfig 的路径解析。

## 缓存文件

### 缓存文件内容重构

alova 缓存文件就是用于渲染侧边栏 api 文档树，快速搜索 api 的数据，因为可以自定义模板，其内部的接口调用函数的名字并不是固定为`Apis.xxx.yyy`了，所以需要标准化缓存数据的格式来记录每个接口调用函数的名字，这样在原来的 vscode 插件中还可以快速搜索，目前的设计如下：

```JavaScript
[
  {
    "path": "src/api",
    "serverName": "server web", // 配置文件有设置才有值
    "apis": Api[], // 伪代码，Api为对应的ts类型
  },
  {
    "path": "src/api2",
    "serverName": "server mobile",
    "apis": Api[],
  },
  // ...
]
```

### 缓存文件路径修改

原先的缓存文件放在`node_modules`中会导致无法同步提交，导致团队多个成员的 api 文档和快速搜索内容不一致，因此缓存文件的路径从原先的`node_modules/.alova`修改到根目录下的`.alova-cache/`。

### 缓存目录结构

从单文件改为目录结构，支持按需读取以提升增量判断性能：

```
.alova-cache/
├── index.json              # 元数据 + 聚合哈希 + 分 tag 哈希（~KB 级）
│   {
│     "entries": [{
│       "path": "src/api",
│       "hash": "abc123def4567890",
│       "tags": { "user": "aaa111", "admin": "bbb222" }
│     }]
│   }
└── data/{slug}.json        # 每个 entry 对应的 API 数据（仅按需加载）
```

**关键设计**：

- 增量判断只需读取 `index.json`（~KB），无需加载全量 API 数据
- `data/{slug}.json` 仅在增量渲染有变化的 tag 时按需加载
- 采用 `crypto.createHash('sha256')` 16 字符前缀做稳定哈希
- `JSON.stringify` 无缩进写入以减少磁盘占用
- **不兼容旧 `.alova-cache.json` 单文件格式**（2.0 破坏性变更）
- **增量生成固定开启**，无法关闭。全量重建由 CLI `-f` 参数触发
- 不保留 `schemaVersion`，格式变更通过 CLI `-f` 触发全量重建

## 预定义模板设计

内置 alova、alovaGlobals、axios、fetch、ky 五套模板。

### functional

通过预定义函数`functional`设置

```JavaScript
import { alova } from 'worma/plugin';

export default defineConfig({
  generator: [
    // ...
    plugins: [alova()]
  ]
})
```

#### 模板设计

采用**按需引入**模式，每个 API 作为独立函数从对应 tag 文件导出，支持 tree-shaking。

##### 模板目录结构

```
alova-functional/typescript/
├── index.ts.handlebars       # 入口：创建 alovaInstance + 重导出所有 tag 模块
├── {tag}.ts.handlebars       # 按 tag 遍历生成 API 函数文件
└── types.ts.handlebars       # 类型声明文件
```

> **注意**：该模板不再包含 `createApis.ts.handlebars`，因为按需引入模式下不需要构建全局 `Apis` 对象。每个 API 函数直接在 `{tag}.ts` 中定义并导出。

##### `index.ts.handlebars`

```handlebars
{{{commentText}}}
import { createAlova } from 'alova'; import { fetchAdapter } from 'alova/fetch';
{{#if (eq framework "vue")}}
  import { vueHook } from 'alova/vue';
{{else if (eq framework "react")}}
  import { reactHook } from 'alova/react';
{{/if}}

export const alovaInstance = createAlova({ baseURL: "{{{baseUrl}}}",
{{#if (eq framework "vue")}}
  statesHook: vueHook,
{{else if (eq framework "react")}}
  statesHook: reactHook,
{{/if}}
requestAdapter: fetchAdapter(), beforeRequest: method => { }, responded: res =>
{ return res.json(); } });

{{#each tagedApis}}
  export * from './{{{tag}}}';
{{/each}}
```

##### `{tag}.ts.handlebars`

```handlebars
{{{commentText}}}
import type { Method, AlovaMethodCreateConfig, AlovaGenerics } from 'alova';
import { Method as MethodClass } from 'alova';
import { alovaInstance } from './index';

{{#each tagedApis}}
{{#apis}}
/**
 * {{summary}}
 * @method {{method}}
 * @path {{{path}}}
 */
export function {{{name}}}(
  config: AlovaMethodCreateConfig<any, any, any, any>{{#or pathParameters queryParameters requestName }} & {
    {{#if pathParameters}}
    pathParams: {{{pathParameters}}};
    {{/if}}
    {{#if queryParameters}}
    params: {{{queryParameters}}};
    {{/if}}
    {{#if requestName}}
    data: {{{requestName}}};
    {{/if}}
  }{{/or}} = {}
): Method<any, any, any, any, any> {
  {{#if pathParameters}}
  const pathParams = config.pathParams || {};
  const resolvedPath = '{{{path}}}'.replace(/\{(\w+)\}/g, (_, key) => pathParams[key]);
  {{else}}
  const resolvedPath = '{{{path}}}';
  {{/if}}

  return new MethodClass(
    '{{method}}',
    alovaInstance,
    resolvedPath,
    config
  );
}

{{/apis}}
{{/each}}
```

> **修正说明**（相对于当前代码）：
>
> 1. ~~`import type { alovaInstance }`~~ → `import { alovaInstance }`：`alovaInstance` 是运行时值，被传入 `new MethodClass(..., alovaInstance, ...)` 构造器，`import type` 会在编译后被擦除导致运行时报错
> 2. 移除 `createApis.ts.handlebars`：`createApis` / `createApiMethod` 构建全局 `Apis` 对象，与按需引入模式设计矛盾
> 3. `types.ts.handlebars` 中 ~~`{{#schemas}}`~~ → `{{#each components}}`：修正与数据字段名不匹配的问题

##### 调用示例

```typescript
// 按需引入，支持 tree-shaking
import { getUser } from "./api/user";
import { createArticle } from "./api/content";

const user = await getUser({ params: { id: 1 } });
```

### alovaGlobals

通过预定义函数`alovaGlobals`设置

```JavaScript
import { alovaGlobals } from 'worma/plugin';

const templateAlovaGlobalsConfig = { ... };
export default defineConfig({
 generator: [
   // ...
   plugins: [alovaGlobals(templateAlovaGlobalsConfig )]
 ]
})
```

> **注意**：`alovaGlobals` 配置中的 `global` 参数会拼接在每个 API 的 `pathKey` 和 `defaultValue` 最前面（如 `Apis.pet.addPet`），以确保全局引用路径正确。

支持参数与原先的参数相同：

```TypeScript
interface TemplateAlovaGlobalsConfig {
  /**
   * 全局导出的api名称，可通过此名称全局范围访问自动生成的api，默认为`Apis`，配置了多个generator时为必填，且不可以重复
   */
  global?: string,
  /**
   * 全局api对象挂载的宿主对象，默认为 `globalThis`，在浏览器中代表 `window`，在nodejs中代表 `global`
   */
  globalHost?: string,
  /**
   * 去掉此参数，只能生成alova@3版本，不再支持v2，之前的v2版本模板去掉
   */
  ~~// version: 'v3',~~

  // 使用import type方式导入，默认false
  useImportType?: boolean
}
```

模板设计：暂无

### axios

通过预定义函数 axios 设置

```JavaScript
import { axios } from 'worma/plugin';

export default defineConfig({
  generator: [
    // ...
    plugins: [axios()]
  ]
})
```

#### 模板设计

采用与 **functional** 一致的**按需引入**模式，每个 API 作为独立函数从对应 tag 文件导出。

##### 模板目录结构

```
axios/typescript/
├── index.ts.handlebars       # 入口：创建 axiosInstance + 重导出所有 tag 模块
├── {tag}.ts.handlebars       # 按 tag 遍历生成 API 函数文件
└── types.ts.handlebars       # 类型声明文件
```

##### `index.ts.handlebars`

```handlebars
{{{commentText}}}
import axios from 'axios'; export const axiosInstance = axios.create({ baseURL:
'{{{baseUrl}}}', });

{{#each tagedApis}}
  export * from './{{{tag}}}';
{{/each}}
```

##### `{tag}.ts.handlebars`

```handlebars
{{{commentText}}}
import type { AxiosRequestConfig } from 'axios'; import { axiosInstance } from
'./index';

{{#each tagedApis}}
  {{#apis}}
    /** *
    {{summary}}
    * @method
    {{method}}
    * @path
    {{{path}}}
    */ export const
    {{{name}}}
    = (config: AxiosRequestConfig{{#or
      pathParameters queryParameters requestName
    }}
      & {
      {{#if pathParameters}}
        pathParams:
        {{{pathParameters}}};
      {{/if}}
      {{#if queryParameters}}
        params:
        {{{queryParameters}}};
      {{/if}}
      {{#if requestName}}
        data:
        {{{requestName}}};
      {{/if}}
      }{{/or}}
    = {}) => {
    {{#if pathParameters}}
      const { pathParams, ...restConfig } = config; const resolvedPath = '{{{path}}}'.replace(/\{(\w+)\}/g,
      (_, key) => pathParams[key]);
    {{else}}
      const restConfig = config; const resolvedPath = '{{{path}}}';
    {{/if}}

    return axiosInstance({ method: '{{method}}', url: resolvedPath,
    ...restConfig, }); };

  {{/apis}}
{{/each}}
```

##### 调用示例

```typescript
// 按需引入，支持 tree-shaking
import { getUser } from "./api/user";

const user = await getUser({ params: { id: 1 } });
```

### fetch

通过预定义函数 fetch 设置

```JavaScript
import { fetch } from 'worma/plugin';

export default defineConfig({
  generator: [
    // ...
    plugins: [fetch()]
  ]
})
```

#### 模板设计

采用与 **functional** 一致的**按需引入**模式。

##### 模板目录结构

```
fetch/typescript/
├── index.ts.handlebars
├── {tag}.ts.handlebars
└── types.ts.handlebars
```

##### `index.ts.handlebars`

```handlebars
{{{commentText}}}
export const BASE_URL = '{{{baseUrl}}}';

{{#each tagedApis}}
  export * from './{{{tag}}}';
{{/each}}
```

##### `{tag}.ts.handlebars`

```handlebars
{{{commentText}}}
import { BASE_URL } from './index';

{{#each tagedApis}}
  {{#apis}}
    /** *
    {{summary}}
    * @method
    {{method}}
    * @path
    {{{path}}}
    */ export const
    {{{name}}}
    = async (config: RequestInit{{#or
      pathParameters queryParameters requestName
    }}
      & {
      {{#if pathParameters}}
        pathParams:
        {{{pathParameters}}};
      {{/if}}
      {{#if queryParameters}}
        params:
        {{{queryParameters}}};
      {{/if}}
      {{#if requestName}}
        data:
        {{{requestName}}};
      {{/if}}
      }{{/or}}
    = {}) => {
    {{#if pathParameters}}
      const { pathParams, ...restConfig } = config; let resolvedPath = '{{{path}}}'.replace(/\{(\w+)\}/g,
      (_, key) => pathParams[key]);
    {{else}}
      const restConfig = config; let resolvedPath = '{{{path}}}';
    {{/if}}

    {{#if queryParameters}}
      if (restConfig.params) { const searchParams = new
      URLSearchParams(restConfig.params); resolvedPath += '?' +
      searchParams.toString(); }
    {{/if}}

    const response = await fetch(BASE_URL + resolvedPath, { method: '{{method}}',
    ...restConfig, }); if (!response.ok) { throw new Error(`HTTP error! status:
    ${response.status}`); } return response.json(); };

  {{/apis}}
{{/each}}
```

##### 调用示例

```typescript
import { getUser } from "./api/user";

const user = await getUser({ params: { id: 1 } });
```

### ky

通过预定义函数 ky 设置

```JavaScript
import { ky } from 'worma/plugin';

export default defineConfig({
  generator: [
    // ...
    plugins: [ky()]
  ]
})
```

#### 模板设计

采用与 **functional** 一致的**按需引入**模式。

##### 模板目录结构

```
ky/typescript/
├── index.ts.handlebars
├── {tag}.ts.handlebars
└── types.ts.handlebars
```

##### `index.ts.handlebars`

```handlebars
{{{commentText}}}
import ky from 'ky'; export const kyInstance = ky.create({ prefixUrl: '{{{baseUrl}}}',
});

{{#each tagedApis}}
  export * from './{{{tag}}}';
{{/each}}
```

##### `{tag}.ts.handlebars`

```handlebars
{{{commentText}}}
import type { Options } from 'ky'; import { kyInstance } from './index';

{{#each tagedApis}}
  {{#apis}}
    /** *
    {{summary}}
    * @method
    {{method}}
    * @path
    {{{path}}}
    */ export const
    {{{name}}}
    = (config: Options{{#or pathParameters queryParameters requestName}}
      & {
      {{#if pathParameters}}
        pathParams:
        {{{pathParameters}}};
      {{/if}}
      {{#if queryParameters}}
        searchParams:
        {{{queryParameters}}};
      {{/if}}
      {{#if requestName}}
        json:
        {{{requestName}}};
      {{/if}}
      }{{/or}}
    = {}) => {
    {{#if pathParameters}}
      const { pathParams, ...restConfig } = config; const resolvedPath = '{{{path}}}'.replace(/\{(\w+)\}/g,
      (_, key) => pathParams[key]);
    {{else}}
      const restConfig = config; const resolvedPath = '{{{path}}}';
    {{/if}}

    return kyInstance(resolvedPath, { method: '{{method}}', ...restConfig,
    }).json(); };

  {{/apis}}
{{/each}}
```

##### 调用示例

```typescript
import { getUser } from "./api/user";

const user = await getUser({ searchParams: { id: 1 } });
```

## `config.performance` — 性能配置

### 类型定义

```ts
interface PerformanceConfig {
  /** schema→TS worker 池策略：'auto' | number | false。默认 'auto'（按接口数自适应） */
  workerPool?: 'auto' | number | false

  /** transform 阶段并发上限。默认 auto（min(64, max(8, cpus*4))） */
  transformConcurrency?: number

  /** 写盘并发数。默认 32 */
  writeConcurrency?: number

  /** 是否对最终文件做 prettier 格式化。默认 true */
  prettierFinal?: boolean

  /** 是否对输出做确定性排序（tag/API/component 按名称字典序）。默认 true */
  deterministicSort?: boolean
}

// 挂载在 GeneratorConfig 上
interface GeneratorConfig {
  // ... 现有字段 ...
  performance?: PerformanceConfig
}
```

4 个参数全部可选，均有合理默认值。增量生成由 CLI `-f` 参数控制，无需配置。

### 环境变量覆盖

| 环境变量                   | 说明                             |
| -------------------------- | -------------------------------- |
| `WORMA_WORKERS=auto\|N\|0` | 覆盖 `performance.workerPool`    |
| `WORMA_PRETTIER=0\|1`      | 覆盖 `performance.prettierFinal` |

---

## 其他修改

1. 去除配置文件项的 fileNameCase 配置项及相关功能

2. 去除 `autoUpdate` 配置项（`Config` 根配置项）及相关功能，包括 `getAutoUpdateConfig` 导出函数；自动更新逻辑后续由 VSCode 扩展自行管理

3. CLI 命令行参数重新设计

### 设计原则

- `-c` 在大多数 CLI 工具中惯例为 `--config`（指定配置文件），原先用作 `--cwd` 容易产生误解，改为 `-p, --project` 更清晰
- `gen` 命令默认以 workspace 模式运行（扫描所有子项目），当用户通过 `-p` 指定具体项目目录时则只对该项目生成
- 去掉 `-w, --workspace` 参数，因为 workspace 模式即为默认行为，无需额外 flag

### 命令设计

```bash
# init 命令：初始化配置文件
alova init [-t, --type <type>] [-T, --template <template>] [-p, --project <path>]

# gen 命令：生成 API 代码
alova gen [-f, --force] [-p, --project <path>]
```

| 命令   | 参数                        | 说明                                                                                         |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------- |
| `init` | `-t, --type <type>`         | 配置文件类型，限定 `typescript` / `ts` / `commonjs` / `module`                               |
| `init` | `-T, --template <template>` | 初始化使用的模板预设，限定 `alova` / `functional` / `axios` / `fetch` / `ky`，默认为 `alova` |
| `init` | `-p, --project <path>`      | 指定项目目录（worma.config 所在目录）                                                        |
| `gen`  | `-f, --force`               | 强制重新生成（忽略缓存）                                                                     |
| `gen`  | `-p, --project <path>`      | 指定项目目录，传入后仅对该项目生成；未传入时以 workspace 模式扫描所有子项目                  |

### 行为逻辑

```
alova gen
  → 默认 workspace 模式：调用 resolveWorkspaces() 扫描所有子项目，逐一生成

alova gen -p ./packages/app
  → 单项目模式：仅对指定目录读取配置并生成
```

### 其他改进

- `--type` 参数使用 commander 的 `.choices()` 在 CLI 层直接校验合法值，拼写错误时立即报错
- 生成过程加入 try/catch 错误处理，异常时正确终止 spinner 并显示错误信息
- 非 workspace 模式的成功/失败提示不再显示 `undefined`，改为显示实际项目路径或 `.`

# 平台插件（platform）

## 背景

原先的 `platform` 参数（swagger/knife4j/yapi）仅支持自动拼接 OpenAPI 文件地址，不够灵活。现改为 `platform` 插件，用户在 `plugins` 中传入一个 API 文档项目名称字符串，插件内部自动获取 `config.input`，根据平台规则拼接 OpenAPI 文件地址并赋值数组给 `config.input`，供后续流程依次尝试。

## 使用方法

```TypeScript
import { defineConfig } from 'worma';
import { platform, alovaGlobals } from 'worma/plugin';

export default defineConfig({
  generator: [
    {
      input: 'https://petstore3.swagger.io',
      // 使用 platform 插件，传入平台类型
      plugins: [platform('swagger'), alovaGlobals()],
      output: './src/api',
    }
  ]
});
```

## 支持的平台

| 平台 / 技术栈                                    | Demo / UI 地址                                              | OpenAPI / Swagger 文件获取方式                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Swagger Petstore (OAS 3.0)**                   | https://petstore3.swagger.io/                               | GET `https://petstore3.swagger.io/api/v3/openapi.json`                                                                          |
| **Swagger Petstore (Swagger 2.0)**               | https://petstore.swagger.io/                                | GET `https://petstore.swagger.io/v2/swagger.json`                                                                               |
| **Spring Boot + Knife4j (OAS3 / springdoc)**     | https://openapi3.demo.knife4jnext.com/doc.html              | GET `https://openapi3.demo.knife4jnext.com/v3/api-docs`                                                                         |
| **Spring Boot + Knife4j (Swagger2 / springfox)** | http://knife4j.xiaominfo.com/doc.html                       | GET `http://knife4j.xiaominfo.com/v2/api-docs`                                                                                  |
| **FastAPI**                                      | http://fastapi-example.dokkuapp.com/docs                    | GET `http://fastapi-example.dokkuapp.com/openapi.json`                                                                          |
| **YApi**                                         | http://yapi.demo.qunar.com/ 或 https://yapi.smart-xwork.cn/ | 无公开端点，需登录→项目→数据管理→导出 Swagger JSON；或用接口 `GET /api/open/plugin/export?type=swagger&pid={pid}&token={token}` |

### 平台规则

用户通过 `platform('<type>')` 传入平台类型字符串，插件内部使用 `config.input` 作为 API 文档项目 URL，根据平台类型自动拼接 OpenAPI 文件地址，赋值数组给 `config.input` 供后续依次尝试。

| 平台类型    | 生成的 input 数组                                                                    |
| ----------- | ------------------------------------------------------------------------------------ |
| `'swagger'` | `['<input>/api/v3/openapi.json', '<input>/v2/swagger.json', '<input>/openapi.json']` |
| `'knife4j'` | `['<input>/v3/api-docs', '<input>/v2/api-docs']`                                     |
| `'fastapi'` | `['<input>/openapi.json']`                                                           |
| `'yapi'`    | `['<input>']`（需包含 pid/token 参数）                                               |

## config.input 支持 string[]

`config.input` 现在支持 `string | string[]`。当设置为数组时，将依次访问每个 URL，返回第一个成功返回的数据，不再继续尝试后续 URL。

```TypeScript
defineConfig({
  generator: [
    {
      input: [
        'https://primary-server.com/openapi.json',
        'https://fallback-server.com/openapi.json',
      ],
      output: './src/api',
      plugins: [alovaGlobals()],
    }
  ]
});
```

> 注意：`platform` 参数已被移除，请使用 `platform` 插件替代。旧的 platform 参数将不再支持。

## 内部实现

`platform` 插件通过 `config` hook 修改 `config.input`：

1. 接收用户传入的平台类型字符串（如 `'swagger'`）
2. 从 `config.input` 读取 API 文档项目 URL
3. 根据平台类型自动拼接生成 OpenAPI 文件 URL 数组
4. 将数组赋值给 `config.input`

核心解析逻辑在 `getOpenApiData` 中：当 `input` 为数组时，依次尝试每个 URL，返回第一个成功的结果。

# 插件系统改进

## Hook 命名规范

将所有 `afterXxx` 形式的 hook 名称改为过去式 `xxxed`，更符合事件命名语义：

| 旧名称              | 新名称          |
| ------------------- | --------------- |
| `afterOpenapiParse` | `openapiParsed` |
| `afterCodeGenerate` | `codeGenerated` |

`beforeOpenapiParse` 和 `beforeCodeGenerate` 保持不变。

## Hook 参数对象化

所有 hook 参数统一改为对象形式，以便后续扩展而不破坏签名：

```TypeScript
/**
 * Function injected into plugin hooks for reporting plugin-scoped progress.
 */
export type ReportProgress = (progress: number, message?: string) => void

interface ApiPlugin {
  name?: string

  config?: (params: {
    config: GeneratorConfig
    projectPath: string
    reportProgress: ReportProgress
  }) => MaybePromise<GeneratorConfig | undefined | null | void>

  beforeOpenapiParse?: (params: {
    config: Readonly<GeneratorConfig>
    projectPath: string
    reportProgress: ReportProgress
  }) => void

  openapiParsed?: (params: {
    config: Readonly<GeneratorConfig>
    document: OpenAPIDocument
    projectPath: string
    reportProgress: ReportProgress
  }) => MaybePromise<OpenAPIDocument | undefined | null | void>

  /** ① 渲染前：注入/修改 templateData，为后续 beforeFileWrite 准备数据 */
  beforeCodeGenerate?: (params: {
    config: Readonly<GeneratorConfig>
    data: TemplateData
    projectPath: string
    reportProgress: ReportProgress
  }) => MaybePromise<void>

  /** ② 每个文件写盘前：可修改单个文件内容。返回修改后内容，返回 void 则不修改 */
  beforeFileWrite?: (params: {
    filePath: string
    content: string
    fileName: string
    tag?: string
    api?: string
    config: Readonly<GeneratorConfig>
    data: TemplateData
    projectPath: string
    isNoOverwrite: boolean
  }) => MaybePromise<string | void>

  /** ③ 所有文件写盘完成后：通知 / 生成额外文件 */
  codeGenerated?: (params: {
    config: Readonly<GeneratorConfig>
    data: TemplateData
    filePaths: string[]
    projectPath: string
    outputDir: string
    error?: Error
    reportProgress: ReportProgress
  }) => MaybePromise<void>
}
```

### 钩子执行时序

```
config() → beforeOpenapiParse() → 解析 OpenAPI → openapiParsed()
→ templateParser.parse()
→ ① beforeCodeGenerate(data)     ← 插件注入配置数据到 templateData
→ 流式渲染 + 写盘：
    loop 每个文件:
       ② beforeFileWrite(filePath, content)  ← 插件修改单文件内容
       writeFile(filePath)
→ ③ codeGenerated(filePaths)     ← 通知 / 生成额外文件（aiDoc 等）
```

### 与旧版的关键区别

| 维度                        | 旧设计                                                     | 新设计                                       |
| --------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| `beforeCodeGenerate` 返回值 | `MaybePromise<string \| void>`                             | `MaybePromise<void>`，直接修改 `params.data` |
| 文件修改方式                | `codeGenerated` 中通过 `files: Record<string,string>` 修改 | `beforeFileWrite` 中逐个文件修改             |
| `codeGenerated` 参数        | 持有 `files` 内容（阻止流式）                              | 仅有 `filePaths: string[]`（流式友好）       |
| 流式写盘                    | 不可用（需全量 files 在内存）                              | ✅ 天然支持，峰值内存 O(max_tag·s)           |

## Config 与 projectPath 参数注入

每个 hook 都会接收 `config` 和 `projectPath` 参数：

- `config` hook：接收可修改的 config 对象
- `beforeOpenapiParse` 及之后的 hook：接收 `Object.freeze()` 冻结的 config，防止误修改
- `projectPath`：当前项目路径，所有 hook 均可获取

## importType 插件改进

`importType` 插件的函数签名不变，但内部实现从 `codeGenerated` 迁移到 `beforeCodeGenerate` + `beforeFileWrite`：

```TypeScript
import { importType } from 'worma/plugin';

function importType(
  imports: Record<string, string[]>,
  options?: { files?: string[] }
): ApiPlugin;
```

### 参数说明

- `imports`：一个对象，key 为模块路径（可附加 `|type` 标记），value 为需要引入的类型名称数组。
  - 当 key 包含 `|type` 后缀时（如 `'module-name|type'`），生成 `import type { ... }` 语句
  - 否则生成普通的 `import { ... }` 语句
- `options.files`：可选，指定需要插入 import 语句的目标文件名匹配列表，默认为 `['globals.d']`

### 新行为逻辑

1. **config hook**（不变）：将 `imports` 中所有类型名称添加到 `config.externalTypes`，使这些类型在生成时被跳过。
2. **beforeCodeGenerate hook**（新）：将 import 配置注入到 `templateData.config.__importTypeLines` 和 `templateData.config.__importTypeTargetFiles` 中。
3. **beforeFileWrite hook**（新）：对每个写盘文件，判断文件名是否匹配 `targetFiles`，若匹配则在块注释之后插入 import 语句并返回修改后内容。

### 迁移原因

旧实现通过 `codeGenerated({ files })` 遍历所有生成文件修改内容，这要求全量 `files` 驻留在内存中，阻塞了流式管线。新实现将数据准备（`beforeCodeGenerate`）和逐文件修改（`beforeFileWrite`）分离，完全兼容流式渲染。

### 使用示例

```TypeScript
import { defineConfig } from 'worma';
import { importType } from 'worma/plugin';

export default defineConfig({
  generator: [
    {
      plugins: [
        importType(
          {
            'my-types|type': ['Pagination', 'BaseResponse'],
            '@/shared': ['File', 'FormData'],
          },
          { files: ['globals.d', 'types'] }
        ),
      ],
    }
  ]
});
```

以上配置将生成：

```typescript
import type { Pagination, BaseResponse } from "my-types";
import { File, FormData } from "@/shared";
```

并将 `Pagination`、`BaseResponse`、`File`、`FormData` 排除在自动生成之外。

---

# Worker 线程架构

## 设计原则

将分散的 Worker 线程管理统一为一个纯泛型 `WorkerPool<Task, Result>`，职责仅为线程生命周期管理 + 任务分发 + 结果收集，不绑定任何业务逻辑。业务方（`templateParser`、`openApiParser`）自行定义 Worker 脚本和任务类型。

## `WorkerPool` API

```ts
// src/core/WorkerPool.ts

export interface WorkerPoolOptions {
  /** Worker 脚本路径 */
  workerScript: string
  /** 共享上下文（通过 workerData 传递给每个 worker） */
  sharedContext: Record<string, unknown>
  /** 线程数 */
  poolSize: number
  /** 空闲回收超时 ms，默认 30000 */
  idleTimeout?: number
}

export class WorkerPool<Task, Result> {
  constructor(options: WorkerPoolOptions)

  /** 池大小 */
  get size(): number

  /** 分发批量任务，Round-Robin 负载均衡 */
  async processBatch(tasks: Task[]): Promise<Result[]>

  /** 销毁所有线程 */
  terminate(): void
}
```

## 自适应池大小

```ts
export function pickPoolSize(apiCount: number): number {
  const cpu = Math.max(1, cpus().length)
  if (apiCount <= 200)    return 0           // 直接主线程
  if (apiCount <= 1000)   return Math.min(2, cpu)
  if (apiCount <= 3000)   return Math.min(4, cpu)
  if (apiCount <= 8000)   return Math.min(Math.ceil(cpu * 0.75), cpu)
  return Math.max(2, cpu - 1)                // ≥8000 用满核心，留 1 核给主线程
}
```

## 使用示例

```ts
// 场景 1：schema→TS 转换（templateParser）
const pool = new WorkerPool<SchemaTask, SchemaResult>({
  workerScript: path.resolve(__dirname, '../workerPool/schemaWorker.js'),
  sharedContext: { document, config, refNameMapEntries },
  poolSize: pickPoolSize(apiCount),
})
const results = await pool.processBatch(schemaTasks)
pool.terminate()

// 场景 2：Swagger2→OpenAPI3 转换（openApiParser）
const pool = new WorkerPool<OpenAPIV2Document, OpenAPIDocument>({
  workerScript: path.resolve(__dirname, 'swagger2Worker.js'),
  sharedContext: {},
  poolSize: 1,
})
const [result] = await pool.processBatch([data])
pool.terminate()
```

## 文件结构

```
src/core/
├── WorkerPool.ts          ← 纯泛型线程池
├── workerPool/            ← 存放具体 Worker 脚本
│   ├── schemaWorker.ts    ← schema→TS worker
│   └── swagger2Worker.ts  ← Swagger2→3 worker（从 openApiParser 移入）
```

## 关键设计决策

- **零依赖**：全部使用 `node:worker_threads` 内置模块
- **懒启动**：首个任务到达时才 spawn worker
- **30s 空闲自动回收**：避免僵尸 worker 占用资源
- **Round-Robin 分发**：负载均衡简单有效
- **2.0 不保留降级**：Worker 不可用直接报错（Node 18+ `worker_threads` 稳定）
- **数据传递**：`workerData` 传共享上下文（一次），消息批处理传任务列表（减少 IPC 开销）

---

# AI skill

## 背景

vibe coding 趋势下，ai 生成接口调用代码时不知道有哪些接口调用，也不知道参数信息，因此提供生成 ai 友好的特定 apis 的 skill

## ai 文档生成插件设计

新增 aiDoc 插件，此插件将会生成对应的 api-skill 文档。

```JavaScript
const aiPlugin = aiDoc({
  template: './custom-ai-skills'
})

defineConfig({
  generator: [
    {
      plugins: [aiPlugin]
    }
  ]
})
```

## 自定义 skill 模板

handlebars 模板，使用方法与模板参数同上

## alova 文档内容设计

### SKILL\.md

```Markdown
---
name: generated-APIs
description: ...
---

# Skill for generated APIs

**## 执行任务**

根据当前的接口需求阅读对应接口的详细文档，以获知接口的详细参数信息和调用方式

**## 接口目录(server1)**

- [获取用户信息](src/api/aidocs/user/info.md)
- [用户登录](src/api/aidocs/user/login.md)
- [管理员权限配置](src/api/aidocs/admin/permissions.md)
- [系统操作日志审计](src/api/aidocs/admin/audit.md)
- [全局通知管理](src/api/aidocs/admin/notifications.md)
- [文章内容管理（CRUD）](src/api/aidocs/content/articles.md)
- [用户评论与回复](src/api/aidocs/content/comments.md)
- [文件上传与资源管理](src/api/aidocs/content/uploads.md)

```

### references/xxx\.md

以 **functional 模板**（按需引入）为例，每个接口生成一个独立文档：

````Markdown
**# 重要：在生成代码前强制执行（不得违反）！！！

在执行代码生成任务前复述以下的使用约定内容，并在生成时确保遵守使用约定

## 使用约定

1. 此文档所标记的接口均使用alova作为请求客户端，需遵循alova的使用规范
2. 需要按需引入对应的API函数，如：`import { selectWarnSecurity } from './api/SwapAccountManageController'`
**

**## 接口**

管理员权限配置

**## Path Parameters**

根据实际需要在`pathParams`中传入参数

```typescript
interface PathParameters {
  // 账户编号
  accountCode: string;
}
````

**## Request Body**

根据实际需要在`data`中传入请求体

```typescript
interface RequestBody {
  // 操作人租户ID，无填0
  operatorTenantId?: string;
  // 页码
  currPage?: number;
  // 每页条数
  pageSize?: number;
  // 账户编号
  accountCode?: string;
  // 账单类型
  billType?: string[];
  // 创建时间开始时间
  startTime?: string;
  // 创建时间结束时间
  endTime?: string;
  // 收支类型：收入、支出
  incomeOrExpenses?: string;
  // 账单编号
  billCode?: string;
}
```

**## Response**

请根据实际需要使用响应数据

```typescript
interface Response {
  // 账户编号
  accountCode?: string;
  // 余额提醒单价
  securityDepositUnitPrice?: number;
  // 余额提醒上限
  securityDepositMax?: number;
}
```

**## 调用示例**

以下调用将返回一个 alova 的 Method 实例。

```typescript
import { selectWarnSecurity } from "./api/SwapAccountManageController";

selectWarnSecurity({
  pathParams: {
    accountCode: "",
  },
  data: {},
});
```

````

---

## AI Skill 引入方式展示

AI Skill 文档中，不再使用 `importDescriptor` 解析 jsconfig/tsconfig 的路径别名。改为在每个 API 文档中展示文件所在位置（`fileLocation`），由 aiDoc 插件在 `codeGenerated` 中计算并注入到模板渲染数据中。这使得文档更清晰地告诉 AI 代码应该放在哪个文件中，而不是猜测 import 路径。

# 生成进度上报

## 背景

OpenAPI 文档体量较大或网络不稳定时，整个生成流程可能耗时数十秒。原版 CLI 仅显示一个不变的 spinner，使用方无法判断当前处于哪个阶段、是否卡住，也无法在 IDE / Web 集成中实现细粒度的进度展示。本特性新增三层可观察性：

1. `generate(config, options)` 暴露 `onProgress` 回调和 `progressInterval` 节流参数。
2. 每个插件生命周期钩子接收一个 `reportProgress` 回调，回报的事件以插件 `name` 标识，便于上层按来源分组。
3. CLI `gen` 命令默认 500ms 刷新 spinner，按来源（`core` 与各插件）多行展示百分比与文案。

## 接口设计

### `GenerateApiOptions` 扩展

```ts
interface GenerateProgress {
  /** 'core' 表示框架核心生成阶段；其他值为插件 name */
  source: string;
  /** 0-100 之间的整数百分比，越界时被框架自动 clamp */
  progress: number;
  /** 可选的人类可读消息 */
  message?: string;
}

interface GenerateApiOptions {
  force?: boolean;
  projectPath?: string;
  /**
   * 进度回调。框架按 progressInterval 节流后向其推送当前所有 source 的最新进度。
   * 回调接收 `Record<source, GenerateProgress>` 快照对象。
   */
  onProgress?: (snapshot: Record<string, GenerateProgress>) => void;
  /**
   * 推送间隔（毫秒），默认 `500`。
   * `<= 0` 时关闭节流，每次 update 即触发回调。
   */
  progressInterval?: number;
}
```

### 插件钩子注入 `reportProgress`

6 个生命周期钩子（`config` / `beforeOpenapiParse` / `openapiParsed` / `beforeCodeGenerate` / `beforeFileWrite` / `codeGenerated`）的参数对象统一新增 `reportProgress` 字段：

```ts
type ReportProgress = (progress: number, message?: string) => void;
```

框架在调用钩子时为每个插件实例绑定一个独立的 `reportProgress`，其内部以该插件的 `name` 作为 source 标识。插件无需关心如何向上传递事件——直接调用即可。如果插件未声明 `name`，则统一以 `'plugin'` 作为 source（多个匿名插件之间会发生覆盖，提示用户填写 name）。

```ts
import { defineConfig } from "worma";

export default defineConfig({
  generator: [
    {
      plugins: [
        {
          name: "remoteSchema",
          async openapiParsed({ document, reportProgress }) {
            reportProgress(10, "fetching schema patches");
            await fetchPatches();
            reportProgress(60, "merging");
            await merge(document);
            reportProgress(100, "done");
          },
        },
      ],
    },
  ],
});
```

### 核心阶段进度锚点

`GeneratorHelper.generate` 的 `core` source 在以下检查点上报进度：

| 百分比 | 阶段                               |
| ------ | ---------------------------------- |
| 5      | starting                           |
| 10     | beforeOpenapiParse                 |
| 20     | parsing openapi document           |
| 35     | openapi parsed                     |
| 45     | openapiParsed (after plugin chain) |
| 55     | template configuration loaded      |
| 65     | template data parsed               |
| 70     | beforeCodeGenerate                 |
| 80     | processing templates               |
| 90     | template generation completed      |
| 95     | writing files                      |
| 100    | completed                          |

跳过路径（`No OpenAPI document found` / `Template data unchanged`）和异常路径同样会上报 100 终态，消息以 `skipped:` 或 `failed:` 前缀，保证 CLI 终态可识别。

## CLI 展示

`alova gen` 默认接入 `onProgress`，将 spinner 文本替换为多行渲染：

```
Generating `./packages/app`...
  [core]   ████████████░░░░░░░░  60% template data parsed
  [aiDoc]  ████░░░░░░░░░░░░░░░░  20% rendering references
```

排序规则：`core` 行始终在最上，插件按 `name` 字典序排列。渲染逻辑被抽取为独立的 `progressRenderer.ts`（`formatProgressBar` / `sortProgressEntries` / `renderProgressSnapshot` / `createProgressRenderer`），既可复用于其他 CLI/IDE 集成，也便于单元测试。

## 兼容性

- `GenerateApiOptions` 新增字段全部可选，旧调用方零改动。
- 钩子参数对象新增 `reportProgress` 属性；原有插件不调用即可，行为不变。
- 不引入新的运行时依赖（CLI 仍使用 `ora`）。

## 品牌重命名：@alova/wormhole → worma

作为独立为通用 OpenAPI 生成工具的一部分，原 `@alova/wormhole` 包已重命名为 `worma`。以下为完整变更清单：

### 包名与安装

| 项目 | 旧值 | 新值 |
|------|------|------|
| npm 包名 | `@alova/wormhole` | `worma` |
| 安装命令 | `npm i @alova/wormhole` | `npm i worma` |
| import 路径 | `from '@alova/wormhole'` | `from 'worma'` |
| plugin import | `from '@alova/wormhole/plugin'` | `from 'worma/plugin'` |

### 配置文件

| 项目 | 旧值 | 新值 |
|------|------|------|
| JS/TS 配置文件 | `alova.config.{js,ts}` | `worma.config.{js,ts}` |
| 简易配置文件 | `.alovarc` | `.wormarc` |

### CLI 命令

| 项目 | 旧值 | 新值 |
|------|------|------|
| 命令名 | `alova init` / `alova gen` | `worma init` / `worma gen` |
| CLI 输出标题 | `Alova API Generator` | `Worma` |

### 缓存目录

| 项目 | 旧值 | 新值 |
|------|------|------|
| 缓存目录 | `.alova-cache/` | `.worma-cache/` |

### VSCode 扩展

| 项目 | 旧值 | 新值 |
|------|------|------|
| 扩展名 | `alova-vscode-extension` | `worma-vscode-extension` |
| 发布者 | `Alova` | `Worma` |
| 显示名称 | `Alova` | `Worma` |
| 版本号 | `2.0.13` | `0.0.1`（重新开始） |
| 命令前缀 | `alova.*` | `worma.*` |
| 配置键 | `alova.autoUpdate` | `worma.autoUpdate` |
| 状态栏 | `Alova` | `Worma` |
| 提示文字 | `module \`@alova/wormhole\` not found` | `module \`worma\` not found` |

### defineConfig 使用示例

```ts
// 旧
import { defineConfig } from '@alova/wormhole';
// 新
import { defineConfig } from 'worma';

// 旧
import { platform } from '@alova/wormhole/plugin';
// 新
import { platform } from 'worma/plugin';
```

### 配置文件命名

使用者需要将项目中的配置文件名从 `alova.config` 改为 `worma.config`：

```bash
# 旧文件名
alova.config.ts
alova.config.js

# 新文件名
worma.config.ts
worma.config.js
```

### 简易配置文件 `.wormarc`

原 `.alovarc` 重命名为 `.wormarc`，格式和用法保持不变。

### 缓存产出物

生成的缓存文件从 `.alova-cache/` 目录改为 `.worma-cache/`，建议更新 `.gitignore`（若之前有配置）。
````
