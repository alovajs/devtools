import type { z } from 'zod/v3'
import type { zConfigType, zPlatformType, zTemplateType } from './zType'
// import { ApiPlugin } from '@/type';
import type { OpenAPIDocument } from '@/type'
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
/**
 * platform type
 */
export type PlatformType = z.infer<typeof zPlatformType> | (string & {}) // When using defineConfig, you need to match the PlatformType.

export type MaybePromise<T> = T | Promise<T>
export interface ApiPlugin {
  name?: string
  /**
   * Replaces or manipulates the options object passed to wormhole.
   * Returning null does NOT replacing anything.
   */
  config?: (config: GeneratorConfig) => MaybePromise<GeneratorConfig | undefined | null | void>
  /**
   * Called before parsing the OpenAPI file.
   */
  beforeOpenapiParse?: (config: GeneratorConfig) => void
  /**
   * Manipulate the openapi document after parsing.
   * Returning null does NOT replacing anything.
   */
  afterOpenapiParse?: (
    document: OpenAPIDocument
  ) => MaybePromise<OpenAPIDocument | undefined | null | void>
  /**
   * Manipulate the template code before generating.
   * Returning null does NOT replacing anything.
   */
  beforeCodeGenerate?: (
    data: any,
    outputFile: string,
    ctx: {
      renderTemplate: () => Promise<string>
      fileName: string
    }
  ) => MaybePromise<string | undefined | null | void>
  /**
   * Called when wormhold has finished code generating.
   */
  afterCodeGenerate?: (error?: Error) => void
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
  /**
   * Template parameters, can be customized as needed.
   * Defaults to empty object {} if not provided.
   */
  config?: Record<string, any>
}

/**
 * Template config function type
 * Returns a TemplateConfigResult object containing path and config
 */
export type TemplateConfig = () => MaybePromise<TemplateConfigResult>

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

export interface GeneratorConfig {
  /**
   * Openapi file path, it supports json and yaml file, and network url
   * @requires true
   *
   * @example
   * input: 'http://localhost:3000/openapi.json'
   * input: 'openapi/api.json' -> Take the current project as the local address of the relative directory
   * input: 'http://192.168.5.123:8080' -> When it does not point to the openapi file, it must be used with the `platform` parameter
   */

  input?: string
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
   * Platforms that support openapi. Currently `swagger` are supported. The default is empty.
   * When this parameter is specified, the input field only needs to specify the url of the document and doesn't need to be specified to the openapi file, reducing the usage threshold.
   * @defualt undefined
   */
  platform?: PlatformType

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
   * Template settings, specify which template to use for code generation.
   * Accepts a sync or async function that returns a TemplateConfigResult object containing path and config.
   * This field is required.
   *
   * Predefined templates:
   * 1. functional: Function-style template, generates function-style API calls, supports tree-shaking, only supports alova v3
   * 2. globals: Global template, the existing global template
   * 3. axios: Axios related template
   * 4. fetch: Fetch related template
   * 5. ky: Ky related template
   */
  template: TemplateConfig

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
   * Specify alova version, 2 or 3, if not specified, it will be automatically determined through the alova version in `package.json`
   */
  version?: number | string

  /**
   * When there is no require, it defaults to require, and only nullable takes effect.
   */
  defaultRequire?: boolean

  /**
   * plugin will be executed before `handleApi`
   */
  plugins?: ApiPlugin[]

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

  /**
   * Whether to automatically update the interface.
   * default is `true`, checked every 5 minutes, set `false` to close it
   *
   * @default true
   */
  autoUpdate?:
    | boolean
    | {
    /**
     * Updated when the editor is opened
     */
      launchEditor?: boolean
      /**
       * Automatic update interval in milliseconds
       */
      interval: number
    }
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
