import { MethodType, RequestBody } from 'alova';
import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod/v3';

export interface FetchOptions {
	headers?: Record<string, string>;
	/** timeout in milliseconds */
	timeout?: number;
	method?: MethodType;
	data?: RequestBody;
	params?: Record<string, any>;
	/** when true, do not throw on non-2xx but still return text; default false */
	insecure?: boolean;
}
declare const zConfigType: z.ZodEnum<[
	"auto",
	"ts",
	"typescript",
	"module",
	"commonjs"
]>;
declare const zPlatformType: z.ZodEnum<[
	"swagger",
	"knife4j",
	"yapi"
]>;
/**
 * Find the corresponding input attribute value
 */
export type ConfigType = z.infer<typeof zConfigType>;
/**
 * platform type
 */
export type PlatformType = z.infer<typeof zPlatformType> | (string & {});
export type MaybePromise<T> = T | Promise<T>;
export interface ApiPlugin {
	name?: string;
	/**
	 * Replaces or manipulates the options object passed to wormhole.
	 * Returning null does NOT replacing anything.
	 */
	config?: (config: GeneratorConfig) => MaybePromise<GeneratorConfig | undefined | null | void>;
	/**
	 * Manipulate the input config before parsing the openapi file.
	 * Returning null does NOT replacing anything.
	 */
	beforeOpenapiParse?: (inputConfig: Pick<GeneratorConfig, "input" | "platform" | "plugins" | "fetchOptions">) => MaybePromise<Pick<GeneratorConfig, "input" | "platform" | "plugins" | "fetchOptions"> | undefined | null | void>;
	/**
	 * Manipulate the openapi document after parsing.
	 * Returning null does NOT replacing anything.
	 */
	afterOpenapiParse?: (document: OpenAPIDocument) => MaybePromise<OpenAPIDocument | undefined | null | void>;
	/**
	 * Manipulate the template code before generating.
	 * Returning null does NOT replacing anything.
	 */
	beforeCodeGenerate?: (data: any, outputFile: string, ctx: {
		renderTemplate: () => Promise<string>;
		fileName: string;
	}) => MaybePromise<string | undefined | null | void>;
	/**
	 * Called when wormhold has finished code generating.
	 */
	afterCodeGenerate?: (error?: Error) => void;
}
export interface HandleApi {
	(apiDescriptor: ApiDescriptor): ApiDescriptor | void | undefined | null;
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
	input?: string;
	fetchOptions?: FetchOptions;
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
	externalTypes?: string[];
	/**
	 * Platforms that support openapi. Currently `swagger` are supported. The default is empty.
	 * When this parameter is specified, the input field only needs to specify the url of the document and doesn't need to be specified to the openapi file, reducing the usage threshold.
	 * @defualt undefined
	 */
	platform?: PlatformType;
	/**
	 * The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.
	 * @requires true
	 */
	output?: string;
	/**
	 * Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 2xx status code.
	 * @defualt 'application/json'
	 */
	responseMediaType?: string;
	/**
	 * Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body.
	 * @default 'application/json'
	 */
	bodyMediaType?: string;
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
	type?: ConfigType;
	/**
	 * Specify alova version, 2 or 3, if not specified, it will be automatically determined through the alova version in `package.json`
	 */
	version?: number | string;
	/**
	 * Globally exported api name, you can access the automatically generated api globally through this name.
	 * it is required when multiple generators are configured, and it cannot be repeated
	 *
	 * @default 'Apis'
	 */
	global?: string;
	/**
	 * The host object of global mounting, default is `globalThis`, it means `window` in browser and `global` in nodejs
	 *
	 * @default 'globalThis'
	 */
	globalHost?: string;
	/**
	 * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
	 *
	 * @default false
	 */
	useImportType?: boolean;
	/**
	 * When there is no require, it defaults to require, and only nullable takes effect.
	 */
	defaultRequire?: boolean;
	/**
	 * plugin will be executed before `handleApi`
	 */
	plugins?: ApiPlugin[];
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
	handleApi?: HandleApi;
	/**
	 * Control the format of output file names. Supports presets or a custom function.
	 * Only affects the output file name, and does not affect template filename resolution.
	 * Presets: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase'
	 */
	fileNameCase?: "camelCase" | "pascalCase" | "kebabCase" | "snakeCase" | ((name: string) => string);
}
export type OpenAPIDocument = OpenAPIV3_1.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export type ApiDescriptor = Omit<OperationObject, "requestBody" | "parameters" | "responses"> & {
	url: string;
	method: string;
	parameters?: Parameter[];
	refNameMap?: Record<string, string>;
	requestBody?: SchemaObject;
	responses?: SchemaObject;
};
/**
 * Creates a plugin factory function with proper typing
 *
 * @param plugin - Function that creates a plugin instance
 * @returns The original plugin function with proper typing
 *
 * @example
 * // Create a custom plugin
 * const myPlugin = createPlugin((options: MyOptions) => ({
 *   handleApi: (apiDescriptor) => {
 *     // Plugin implementation
 *     return apiDescriptor;
 *   }
 * }));
 *
 * // Use the plugin
 * generate({
 *   generator: [{
 *     // ...
 *     plugins: [myPlugin({ key: 'value' })]
 *   }]
 * });
 */
export declare function createPlugin<T extends any[]>(plugin: (...args: T) => ApiPlugin): (...args: T) => ApiPlugin;
export interface APIFoxBody {
	scope?: {
		type?: "ALL" | "SELECTED_TAGS";
		selectedTags?: string[];
		excludedByTags?: string[];
	};
	options?: {
		includeApifoxExtensionProperties?: boolean;
		addFoldersToTags?: boolean;
	};
	oasVersion?: "2.0" | "3.0" | "3.1";
	exportFormat?: "JSON" | "YAML";
	environmentIds?: string[];
}
export interface ApifoxOptions extends Pick<APIFoxBody, "oasVersion" | "exportFormat">, Pick<NonNullable<APIFoxBody["options"]>, "includeApifoxExtensionProperties" | "addFoldersToTags"> {
	projectId: string;
	apifoxToken: string;
	locale?: string;
	apifoxVersion?: string;
	selectedTags?: string[];
	excludedByTags?: string[];
}
export declare function apifox({ projectId, locale, apifoxVersion, selectedTags, excludedByTags, apifoxToken, oasVersion, exportFormat, includeApifoxExtensionProperties, addFoldersToTags, }: ApifoxOptions): ApiPlugin;
/**
 * Filter configuration interface
 */
export interface FilterApiConfig {
	/**
	 * Target scope for filtering, defaults to 'url'
	 */
	scope?: "url" | "tag";
	/**
	 * Include rule:
	 * - string: target contains this string
	 * - RegExp: target matches this pattern
	 * - function: custom matching logic
	 */
	include?: string | RegExp | ((key: string) => boolean);
	/**
	 * Exclude rule:
	 * - string: target contains this string
	 * - RegExp: target matches this pattern
	 * - function: custom matching logic
	 */
	exclude?: string | RegExp | ((key: string) => boolean);
}
/**
 * Main processing function for filtering API descriptors
 * @param apiDescriptor API descriptor
 * @param configs Configuration array
 * @returns Filtered API descriptor, or null if filtered out
 */
export declare function filterApiDescriptor(apiDescriptor: ApiDescriptor, configs: FilterApiConfig[]): ApiDescriptor | null;
/**
 * Creates a plugin for filtering APIs
 *
 * @param config Filter configuration, can be a single config or array of configs
 * @returns API plugin instance
 *
 * @example
 * ```ts
 * // Only include URLs containing 'user'
 * const userOnlyFilter = apiFilter({
 *   include: 'user'
 * });
 *
 * // Exclude tags containing 'internal'
 * const noInternalFilter = apiFilter({
 *   scope: 'tag',
 *   exclude: 'internal'
 * });
 *
 * // Multi-condition filtering (union)
 * const multiFilter = apiFilter([
 *   { include: 'user' },
 *   { include: 'admin' }
 * ]);
 * ```
 */
export declare function apiFilter(config: FilterApiConfig | FilterApiConfig[]): ApiPlugin;
export declare function importType(config: Record<string, string[]>): ApiPlugin;
export type ModifierScope = "params" | "pathParams" | "data" | "response";
export type SchemaPrimitive = "number" | "string" | "boolean" | "undefined" | "null" | "unknown" | "any" | "never";
/**
 * 表示数组类型
 */
export interface SchemaArray {
	type: "array";
	items: Schema | Schema[];
}
/**
 * 修改参数为引用类型
 * 在key末端添加上?表示为可选值
 */
export interface SchemaReference {
	[attr: string]: Schema;
}
/**
 * 枚举类型表示
 */
export interface SchemaEnum {
	enum: Array<string | number | boolean | null>;
	type?: "string" | "number" | "integer" | "boolean" | "null";
}
/**
 * 组合类型表示（与/或/交叉）
 */
export interface SchemaOneOf {
	oneOf: Schema[];
}
export interface SchemaAnyOf {
	anyOf: Schema[];
}
export interface SchemaAllOf {
	allOf: Schema[];
}
/**
 * 数据Schema
 * SchemaArray表示类型数组，而数组表示“或”的意思
 */
export type Schema = SchemaPrimitive | SchemaReference | SchemaArray | SchemaEnum | SchemaOneOf | SchemaAnyOf | SchemaAllOf | Array<SchemaPrimitive | SchemaReference | SchemaArray | SchemaEnum>;
export interface ModifierConfig<T extends Schema> {
	/**
	 * 生效范围，表示处理哪个位置的参数
	 */
	scope: ModifierScope;
	/**
	 * 匹配规则，只有匹配到的才会进行转换，不指定则转换全部
	 * string：原参数名包含此string；RegExp：原参数名匹配此正则；函数时接收key并返回是否匹配的boolean值
	 */
	match?: string | RegExp | ((key: string) => boolean);
	/**
	 * handler用于灵活修改参数类型值
	 * @param schema Schema中的一种，由用户自行定义
	 * @returns 返回多种参数，具体为：Schema表示修改的类型；{ required: boolean, value: Schema }表示可将当前值修改为是否必填；void | null | undefined表示移除当前字段
	 */
	handler: (schema: T) => Schema | {
		required: boolean;
		value: Schema;
	} | void | null | undefined;
}
export type PayloadModifierConfig = ModifierConfig<Schema>;
export declare function payloadModifier(configs: PayloadModifierConfig[]): ApiPlugin;
/**
 * Rename style options
 */
export type RenameStyle = "camelCase" | "kebabCase" | "snakeCase" | "pascalCase";
/**
 * Rename plugin configuration
 */
export interface RenameConfig {
	/**
	 * Target scope for renaming, defaults to 'url'
	 */
	scope?: "url" | "params" | "pathParams" | "data" | "response" | "refName";
	/**
	 * Matching rule for selective renaming:
	 * - string: target contains this string
	 * - RegExp: target matches this pattern
	 * - function: custom matching logic
	 * If not specified, all targets will be processed
	 */
	match?: string | RegExp | ((key: string) => boolean);
	/**
	 * Naming style to apply
	 */
	style?: RenameStyle;
	/**
	 * Custom transformation function
	 * Will be applied before style transformation
	 */
	transform?: (apiDescriptor: ApiDescriptor) => string;
}
/**
 * Creates a rename plugin that transforms API descriptors
 * according to specified naming rules
 */
export declare function rename(config: RenameConfig | RenameConfig[]): ApiPlugin;
/**
 * Tag modifier handler function type
 * Receives a tag string and returns the modified tag string, or null/undefined/void to remove the tag
 */
export type ModifierHandler = (tag: string) => string | null | undefined | void;
/**
 * Processes tags in the API descriptor
 * @param apiDescriptor The API descriptor
 * @param handler Tag modifier handler function
 * @returns Modified API descriptor
 */
export declare function processApiTags(apiDescriptor: ApiDescriptor, handler: ModifierHandler): ApiDescriptor;
/**
 * Creates a tag modifier plugin
 *
 * @param handler Tag modifier handler function that receives a tag string and returns modified tag or null/undefined/void to remove the tag
 * @returns API plugin instance
 *
 * @example
 * ```ts
 * // Convert all tags to uppercase
 * const upperCasePlugin = tagModifier(tag => tag.toUpperCase());
 *
 * // Add prefix to tags
 * const prefixPlugin = tagModifier(tag => `api-${tag}`);
 *
 * // Remove specific tags
 * const filterPlugin = tagModifier(tag => tag === 'internal' ? null : tag);
 *
 * // Use the plugin
 * export default {
 *   generator: [{
 *     // ...other config
 *     plugins: [upperCasePlugin]
 *   }]
 * };
 * ```
 */
export declare function tagModifier(handler: ModifierHandler): ApiPlugin;

export {};
