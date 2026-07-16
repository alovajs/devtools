import type { z } from 'zod/v3'
import type { zConfigType, zTemplateType } from './zType'
// import { ApiPlugin } from '@/type';
import type { OpenAPIDocument, TemplateData } from '@/type'
import type { ApiDescriptor } from '@/type/api'
import type { FetchOptions } from '@/utils/base'
/**
 * Find the corresponding input attribute value
 */
export type ConfigType = z.infer<typeof zConfigType>
/**
 * template type
 */
export type TemplateType = z.infer<typeof zTemplateType>

export type MaybePromise<T> = T | Promise<T>

/**
 * Progress event reported either by the core generator or by a plugin hook.
 */
export interface GenerateProgress {
  /**
   * Source of the progress event. `'core'` for the framework lifecycle, otherwise the plugin name.
   */
  source: string
  /**
   * Completion percentage in the [0, 100] range.
   */
  progress: number
  /**
   * Optional human-readable status message.
   */
  message?: string
  /**
   * Optional named lifecycle stage. Used by the CLI to display human-readable progress.
   */
  stage?: string
}

/**
 * Function injected into plugin hooks for reporting plugin-scoped progress.
 */
export type ReportProgress = (progress: number, message?: string) => void

export interface ConfigHookParams {
  config: GeneratorConfig
  projectPath: string
  reportProgress: ReportProgress
}

export interface BeforeSpecParseHookParams {
  config: Readonly<GeneratorConfig>
  /** The raw OpenAPI specification text (JSON or YAML), before it is parsed. */
  spec: string
  projectPath: string
  reportProgress: ReportProgress
}

export interface SpecParsedHookParams {
  config: Readonly<GeneratorConfig>
  document: OpenAPIDocument
  projectPath: string
  reportProgress: ReportProgress
}

export interface BeforeCodeGenerateHookParams {
  config: Readonly<GeneratorConfig>
  data: TemplateData
  projectPath: string
  reportProgress: ReportProgress
}

export interface BeforeFileWriteHookParams {
  config: Readonly<GeneratorConfig>
  data: TemplateData
  filePath: string
  content: string
  projectPath: string
  reportProgress: ReportProgress
  /** Template file metadata: tag/api/global */
  meta: {
    templateType?: 'tag' | 'api'
    tag?: string
    api?: string
  }
}

/** Parameters for the convenience renderTemplate function passed to codeGenerated hook */
export interface RenderTemplateParams {
  templatePath: string
  type: import('@/type').TemplateType
  outputDir: string
  data: import('@/type').TemplateData
  options?: {
    changedTags?: Set<string>
    beforeFileWrite?: (params: {
      filePath: string
      content: string
      meta: { templateType?: 'tag' | 'api', tag?: string, api?: string }
    }) => import('./type').MaybePromise<string>
    writeConcurrency?: number
    formatFile?: boolean
  }
}

export interface CodeGeneratedHookParams {
  config: Readonly<GeneratorConfig>
  data: TemplateData
  /** Paths of all generated files (for notification; content is not held) */
  filePaths: string[]
  /** Absolute output directory */
  outputDir: string
  projectPath: string
  error?: Error
  reportProgress: ReportProgress
  /** Convenience: render a template to a directory in one call */
  renderTemplate: (params: RenderTemplateParams) => Promise<{ filePaths: string[] }>
}

export interface GetTemplateHookParams {
  config: Readonly<GeneratorConfig>
  projectPath: string
  reportProgress: ReportProgress
}

export interface OnHandlebarsCreatedHookParams {
  hbs: typeof import('handlebars')
  config: Readonly<GeneratorConfig>
  projectPath: string
  reportProgress: ReportProgress
}

export interface ApiPlugin {
  name?: string
  /**
   * Replaces or manipulates the options object passed to worma.
   * Returning null does NOT replacing anything.
   */
  config?: (params: ConfigHookParams) => MaybePromise<GeneratorConfig | undefined | null | void>
  /**
   * Called after the raw OpenAPI spec text is fetched but before it is parsed.
   * Return a (possibly modified) string to replace the spec text that will be
   * parsed. Returning nothing keeps the original spec text.
   */
  beforeSpecParse?: (
    params: BeforeSpecParseHookParams,
  ) => MaybePromise<string | undefined | null | void>
  /**
   * Manipulate the openapi document after parsing.
   * Returning null does NOT replacing anything.
   */
  specParsed?: (
    params: SpecParsedHookParams,
  ) => MaybePromise<OpenAPIDocument | undefined | null | void>
  /**
   * Called before code generation. Mutate `params.data` directly to inject
   * configuration data (no longer returns a value).
   */
  beforeCodeGenerate?: (
    params: BeforeCodeGenerateHookParams,
  ) => MaybePromise<void>
  /**
   * Called right before each file is written to disk.
   * Can modify the file content by returning the new content.
   */
  beforeFileWrite?: (
    params: BeforeFileWriteHookParams,
  ) => MaybePromise<string>
  /**
   * Called after ALL files have been written to disk.
   * Used for post-processing e.g. generating additional documentation, displaying notifications.
   * The `filePaths` array contains all generated file paths (no content).
   */
  codeGenerated?: (params: CodeGeneratedHookParams) => MaybePromise<void>
  /**
   * Provide the template path for code generation.
   * Multiple plugins can implement this; the last non-nil return value wins.
   */
  getTemplate?: (
    params: GetTemplateHookParams,
  ) => MaybePromise<TemplateConfigResult | undefined | null | void>
  /**
   * Called when a new Handlebars instance is created for template rendering.
   * Use this to register custom helpers or partials on the hbs instance.
   */
  onHandlebarsCreated?: (
    params: OnHandlebarsCreatedHookParams,
  ) => MaybePromise<void>
}
export type ApiPluginHooks = keyof Omit<ApiPlugin, 'name' | 'extends'>

export interface HandleApi {
  (apiDescriptor: ApiDescriptor): ApiDescriptor | void | undefined | null
}

/**
 * Template configuration result
 */
export interface TemplateConfigResult {
  /**
   * Template path string (relative to project root or absolute path).
   * Relative paths are resolved relative to process.cwd()
   * This field is required.
   */
  path: string
}

/**
 * Options for globals template
 */
export interface GlobalsTemplateOptions {
  /**
   * Globally exported api name, you can access the automatically generated api globally through this name.
   * Default is 'Apis'. Required when multiple generators are configured, and cannot be repeated.
   */
  global?: string

  /**
   * The host object of global mounting, default is `globalThis`, it means `window` in browser and `global` in nodejs
   * @default 'globalThis'
   */
  globalHost?: string

  /**
   * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
   * @default false
   */
  useImportType?: boolean
}

/**
 * Options for functional template
 */
export interface FunctionalTemplateOptions {
  /**
   * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
   * @default false
   */
  useImportType?: boolean
}

/**
 * Options for axios/fetch/ky templates
 */
export interface RequestLibTemplateOptions {
  /**
   * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
   * @default false
   */
  useImportType?: boolean
}

/**
 * Performance tuning options for code generation.
 */
export interface PerformanceConfig {
  /** schema→TS worker pool strategy. Default 'auto' (adaptive by API count) */
  workerPool?: 'auto' | number | false

  /** Max concurrency for transform phase. Default auto (min(64, max(8, cpus*4))) */
  transformConcurrency?: number

  /** Max parallelism for file writes. Default 32 */
  writeConcurrency?: number

  /** Apply prettier formatting to final files before write. Default true (schema-level prettier is always disabled) */
  formatFile?: boolean

  /** Sort tags/APIs/components alphabetically for deterministic output. Default true */
  deterministicSort?: boolean
}

export interface GeneratorConfig {
  /**
   * Openapi file path, it supports json and yaml file, and network url.
   * Can be a single URL string or an array of URLs. When set to an array,
   * each URL will be tried in order and the first successful response is returned.
   * @requires true
   *
   * @example
   * input: 'http://localhost:3000/openapi.json'
   * input: 'openapi/api.json' -> Take the current project as the local address of the relative directory
   * input: ['https://primary.com/openapi.json', 'https://fallback.com/openapi.json'] -> Try each URL in order
   */

  input?: string | string[]
  // Fetch options used by remote OpenAPI retrieval (headers, timeout, insecure). See FetchOptions in '@/utils/base'.
  fetchOptions?: FetchOptions
  /**
   * A list of type identifiers to exclude from generation.
   * Matches against type names parsed from the OpenAPI schema; matched types
   * are skipped and referenced directly by their identifier in generated code
   * to avoid duplicate or conflicting declarations.
   * Use this when you already have hand-written types or types provided by
   * frameworks/libraries that should not be generated.
   *
   * @example
   * externalTypes: ['File', 'Blob', 'FormData', 'Pagination']
   */
  externalTypes?: string[]

  /**
   * The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.
   * @requires true
   */
  output?: string

  /**
   * Whether to generate documentation comments, default is true.
   * Set to false to improve generation performance.
   * @default true
   */
  docComment?: boolean

  /**
   * Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 2xx status code.
   * Can be a string or an array of strings for fallback media types.
   * @default 'application/json'
   */
  responseMediaType?: string | string[]

  /**
   * Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body.
   * Can be a string or an array of strings for fallback media types.
   * @default 'application/json'
   */
  bodyMediaType?: string | string[]

  /**
   * Custom server name for displaying in the sidebar when multiple API docs are configured.
   * Default names are server1, server2, server3...
   */
  serverName?: string

  /**
   * The type of generated code. The optional value is `auto/ts/typescript/module/commonjs`.
   * default is `auto`, it means the type of current project will be determined through certain rules.
   *
   * @param type
   * 1. ts/typescript: The same meaning means generating ts type files
   * 2. module: generate esModule specification file
   * 3. commonjs: means generating commonjs specification file
   *
   * @default 'auto'
   */
  type?: ConfigType

  /**
   * When there is no require, it defaults to require, and only nullable takes effect.
   */
  defaultRequire?: boolean

  /**
   * plugin will be executed before `handleApi`
   */
  plugins?: ApiPlugin[]

  /**
   * Performance tuning options for code generation.
   */
  performance?: PerformanceConfig

  /**
   * Filter or convert the generated api function and return a new `apiDescriptor` to generate the api.
   * When this function is not specified, `apiDescriptor` object is not converted.
   * The type of `apiDescriptor` is the same as the api item of openapi file.
   *
   * @see https://spec.openapis.org/oas/v3.1.0.html#operation-object
   *
   * @example
   * ```js
   * // Do not generate the apis that starts with `/user`
   * handleApi(apiDescriptor) {
   *   if (apiDescriptor.path.startsWith('/user')) {
   *     return;
   *   }
   *   return apiDescriptor;
   * }
   * ```
   *
   * ```js
   * // modify the api's parameters
   * handleApi(apiDescriptor) {
   *   apiDescriptor.parameters = (apiDescriptor.parameters || []).filter(
   *     param => param.in === 'header' && param.name === 'token'
   *   );
   *   delete apiDescriptor.requestBody.id;
   *   apiDescriptor.url = apiDescriptor.url.replace('/user', '');
   *   return apiDescriptor;
   * }
   * ```
   */
  handleApi?: HandleApi
}
export interface Config {
  /**
   * API generation settings are arrays. Each item represents an automatically generated rule, including the generated input and output directories, specification file addresses, etc.
   * Currently, only OpenAPI specifications are supported, including OpenAPI 2.0 and 3.0 specifications.
   */
  generator: GeneratorConfig[]
}
export type UserConfig = Config
export type UserConfigFnObject = () => UserConfig
export type UserConfigFnPromise = () => Promise<UserConfig>
export type UserConfigFn = () => UserConfig | Promise<UserConfig>

export type UserConfigExport
  = | UserConfig
    | Promise<UserConfig>
    | UserConfigFnObject
    | UserConfigFnPromise
    | UserConfigFn
