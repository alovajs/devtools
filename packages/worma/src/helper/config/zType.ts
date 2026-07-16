import type { TemplateConfigResult } from '@/helper/config/type'
import type { ApiDescriptor, ApiPlugin, GeneratorConfig } from '@/type'
import type { FetchOptions } from '@/utils/base'
import path from 'node:path'
import { z } from 'zod/v3' // v4版本不稳定，暂时使用v3
/**
 * Find the corresponding input attribute value
 */
export const zConfigType = z.enum(['auto', 'ts', 'typescript', 'module', 'commonjs'])
/**
 * template type
 */
export const zTemplateType = z.enum(['typescript', 'module', 'commonjs'])

export const zTemplateResult = z.object({
  path: z.string(),
}) as z.ZodSchema<TemplateConfigResult>

export const zApiDescriptor = z.any() as z.ZodSchema<ApiDescriptor>

export const zHandleApi = z
  .function()
  .args(zApiDescriptor)
  .returns(z.union([zApiDescriptor, z.undefined(), z.null(), z.void()]))
export const zFetchOptions = z.record(z.string(), z.any()) as z.ZodSchema<FetchOptions>

export const zApiPlugin = z.object({
  name: z.string().optional(),
  config: z.function().optional(),
  beforeSpecParse: z.function().optional(),
  specParsed: z.function().optional(),
  beforeCodeGenerate: z.function().optional(),
  beforeFileWrite: z.function().optional(),
  codeGenerated: z.function().optional(),
  getTemplate: z.function().optional(),
  onHandlebarsCreated: z.function().optional(),
}) as z.ZodSchema<ApiPlugin>

export const _zGeneratorConfig = z.object({
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
  input: z.union([z.string(), z.array(z.string())]).refine(
    val => (typeof val === 'string' && val.length > 0) || (Array.isArray(val) && val.length > 0),
    'Field input is required in `config.generator`',
  ),
  // Fetch options used by remote OpenAPI retrieval (headers, timeout, insecure). See FetchOptions in '@/utils/base'.
  fetchOptions: zFetchOptions.optional(),
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
  externalTypes: z.array(z.string()).optional(),
  /**
   * The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.
   * @requires true
   */
  output: z
    .string({
      required_error: 'Field output is required in `config.generator`',
    })
    .nonempty('Field output is required in `config.generator`'),
  /**
   * Whether to generate documentation comments, default is true.
   * Set to false to improve generation performance.
   */
  docComment: z.boolean().optional(),
  /**
   * Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 2xx status code.
   * Can be a string or an array of strings for fallback media types.
   */
  responseMediaType: z.union([z.string(), z.array(z.string())]).optional(),
  /**
   * Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body.
   * Can be a string or an array of strings for fallback media types.
   */
  bodyMediaType: z.union([z.string(), z.array(z.string())]).optional(),
  /**
   * Custom server name for displaying in the sidebar when multiple API docs are configured.
   */
  serverName: z.string().optional(),
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
  type: zConfigType.optional(),
  /**
   * When there is no require, it defaults to require, and only nullable takes effect.
   */
  defaultRequire: z.boolean().optional(),
  /**
   * plugin will be executed before `handleApi`
   */
  plugins: z.array(zApiPlugin).optional(),
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
  handleApi: zHandleApi.optional(),
})

export const zGeneratorConfig = _zGeneratorConfig as z.ZodSchema<GeneratorConfig>

export const zConfig = z.object({
  /**
   * API generation settings are arrays. Each item represents an automatically generated rule, including the generated input and output directories, specification file addresses, etc.
   * Currently, only OpenAPI specifications are supported, including OpenAPI 2.0 and 3.0 specifications.
   */
  generator: z
    .array(zGeneratorConfig)
    .min(1, 'No items found in the `config.generator`')
    .superRefine((data, ctx) => {
      if (data.length < 2) {
        return
      }
      const outputSet = new Set<string>()
      data.forEach((item) => {
        if (outputSet.has(path.join(item.output ?? ''))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['generator', 'output'],
            message: `output \`${item.output}\` is repeated`,
          })
          return
        }
        outputSet.add(path.join(item.output ?? ''))
      })
    }),
})
