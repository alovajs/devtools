import { standardLoader } from '@/core/loader';
import path from 'node:path';
import { z } from 'zod';
import { ApiPlugin } from '~/index';
/**
 * Find the corresponding input attribute value
 */
export const zConfigType = z.enum(['auto', 'ts', 'typescript', 'module', 'commonjs']);
/**
 * template type
 */
export const zTemplateType = z.enum(['typescript', 'module', 'commonjs']);
/**
 * platform type
 */
export const zPlatformType = z.enum(['swagger', 'knife4j', 'yapi']);

export const zApiDescriptor = z.any();

export const zHandleApi = z
  .function()
  .args(zApiDescriptor)
  .returns(z.union([zApiDescriptor, z.undefined(), z.null(), z.void()]));

export const zPlugin: z.ZodSchema<ApiPlugin> = z.object({
  name: z.string().optional(),
  get extends() {
    return z
      .union([zGeneratorConfig.partial(), z.function().args(zGeneratorConfig).returns(zGeneratorConfig.partial())])
      .optional();
  }
});

export const zGeneratorConfig = z.object({
  /**
   * Openapi file path, it supports json and yaml file, and network url
   * @requires true
   *
   * @example
   * input: 'http://localhost:3000/openapi.json'
   * input: 'openapi/api.json' -> Take the current project as the local address of the relative directory
   * input: 'http://192.168.5.123:8080' -> When it does not point to the openapi file, it must be used with the `platform` parameter
   */
  input: z
    .string({
      required_error: 'Field input is required in `config.generator`'
    })
    .nonempty('Field input is required in `config.generator`'),
  /**
   * Platforms that support openapi. Currently `swagger` are supported. The default is empty.
   * When this parameter is specified, the input field only needs to specify the url of the document and doesn't need to be specified to the openapi file, reducing the usage threshold.
   * @defualt undefined
   */
  platform: zPlatformType.optional(),
  /**
   * The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.
   * @requires true
   */
  output: z
    .string({
      required_error: 'Field output is required in `config.generator`'
    })
    .nonempty('Field output is required in `config.generator`'),
  /**
   * Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 2xx status code.
   * @defualt 'application/json'
   */
  responseMediaType: z.string().optional(),
  /**
   * Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body.
   * @default 'application/json'
   */
  bodyMediaType: z.string().optional(),
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
   * Specify alova version, 2 or 3, if not specified, it will be automatically determined through the alova version in `package.json`
   */
  version: z.number().optional(),
  /**
   * Globally exported api name, you can access the automatically generated api globally through this name.
   * it is required when multiple generators are configured, and it cannot be repeated
   *
   * @default 'Apis'
   */
  global: z
    .string()
    .optional()
    .refine(
      data => !data || standardLoader.validate(data),
      data => ({
        message: `\`${data}\` does not match variable specification`
      })
    ),
  /**
   * The host object of global mounting, default is `globalThis`, it means `window` in browser and `global` in nodejs
   *
   * @default 'globalThis'
   */
  globalHost: z.string().optional(),
  /**
   * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
   *
   * @default false
   */
  useImportType: z.boolean().optional(),
  /**
   * When there is no require, it defaults to require, and only nullable takes effect.
   */
  defaultRequire: z.boolean().optional(),
  /**
   * plugin will be executed before `handleApi`
   */
  plugins: z.array(zPlugin).optional(),
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
  handleApi: zHandleApi.optional()
});

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
        return;
      }
      const globalKeySet = new Set<string>();
      const outputSet = new Set<string>();
      data.forEach(item => {
        if (outputSet.has(path.join(item.output))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['generator', 'output'],
            message: `output \`${item.output}\` is repated`
          });
          return;
        }
        outputSet.add(path.join(item.output));
        if (!item.global) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['generator', 'global'],
            message: 'Field global is required in `config.generator`'
          });
          return;
        }
        if (globalKeySet.has(item.global)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['generator', 'global'],
            message: `global \`${item.global}\` is repated`
          });
        }
        globalKeySet.add(item.global);
      });
    }),

  /**
   * Whether to automatically update the interface.
   * default is `true`, checked every 5 minutes, set `false` to close it
   *
   * @default true
   */
  autoUpdate: z
    .union([
      z.boolean(),
      z
        .object({
          /**
           * Updated when the editor is opened
           */
          launchEditor: z.boolean().optional(),
          /**
           * Automatic update interval in milliseconds
           */
          interval: z.number()
        })
        .catch(({ input }) => input)
    ])
    .optional()
    .superRefine((data, ctx) => {
      if (typeof data === 'object') {
        const { interval } = data;
        const time = Number(interval);
        if (Number.isNaN(time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['autoUpdate', 'interval'],
            message: 'autoUpdate.interval must be a number'
          });
          return;
        }
        if (time <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['autoUpdate', 'interval'],
            message: 'Expected to set number which great than 1 in `config.autoUpdate.interval`'
          });
        }
      }
    })
});
