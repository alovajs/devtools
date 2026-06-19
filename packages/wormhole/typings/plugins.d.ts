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
declare const zTemplateType: z.ZodEnum<[
	"typescript",
	"module",
	"commonjs"
]>;
/**
 * Find the corresponding input attribute value
 */
export type ConfigType = z.infer<typeof zConfigType>;
/**
 * template type
 */
export type TemplateType = z.infer<typeof zTemplateType>;
export type MaybePromise<T> = T | Promise<T>;
/**
 * Function injected into plugin hooks for reporting plugin-scoped progress.
 */
export type ReportProgress = (progress: number, message?: string) => void;
export interface ConfigHookParams {
	config: GeneratorConfig;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface BeforeOpenapiParseHookParams {
	config: Readonly<GeneratorConfig>;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface OpenapiParsedHookParams {
	config: Readonly<GeneratorConfig>;
	document: OpenAPIDocument;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface BeforeCodeGenerateHookParams {
	config: Readonly<GeneratorConfig>;
	data: TemplateData;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface BeforeFileWriteHookParams {
	config: Readonly<GeneratorConfig>;
	data: TemplateData;
	filePath: string;
	content: string;
	projectPath: string;
	reportProgress: ReportProgress;
	/** Template file metadata: tag/api/global */
	meta: {
		templateType?: "tag" | "api";
		tag?: string;
		api?: string;
	};
}
export interface CodeGeneratedHookParams {
	config: Readonly<GeneratorConfig>;
	data: TemplateData;
	/** Paths of all generated files (for notification; content is not held) */
	filePaths: string[];
	/** Absolute output directory */
	outputDir: string;
	projectPath: string;
	error?: Error;
	reportProgress: ReportProgress;
}
export interface GetTemplateHookParams {
	config: Readonly<GeneratorConfig>;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface OnHandlebarsCreatedHookParams {
	hbs: typeof import("handlebars");
	config: Readonly<GeneratorConfig>;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface ApiPlugin {
	name?: string;
	/**
	 * Replaces or manipulates the options object passed to wormhole.
	 * Returning null does NOT replacing anything.
	 */
	config?: (params: ConfigHookParams) => MaybePromise<GeneratorConfig | undefined | null | void>;
	/**
	 * Called before parsing the OpenAPI file.
	 */
	beforeOpenapiParse?: (params: BeforeOpenapiParseHookParams) => void;
	/**
	 * Manipulate the openapi document after parsing.
	 * Returning null does NOT replacing anything.
	 */
	openapiParsed?: (params: OpenapiParsedHookParams) => MaybePromise<OpenAPIDocument | undefined | null | void>;
	/**
	 * Called before code generation. Mutate `params.data` directly to inject
	 * configuration data (no longer returns a value).
	 */
	beforeCodeGenerate?: (params: BeforeCodeGenerateHookParams) => MaybePromise<void>;
	/**
	 * Called right before each file is written to disk.
	 * Can modify the file content by returning the new content.
	 */
	beforeFileWrite?: (params: BeforeFileWriteHookParams) => MaybePromise<string>;
	/**
	 * Called after ALL files have been written to disk.
	 * Used for post-processing e.g. generating additional documentation, displaying notifications.
	 * The `filePaths` array contains all generated file paths (no content).
	 */
	codeGenerated?: (params: CodeGeneratedHookParams) => MaybePromise<void>;
	/**
	 * Provide the template path for code generation.
	 * Multiple plugins can implement this; the last non-nil return value wins.
	 */
	getTemplate?: (params: GetTemplateHookParams) => MaybePromise<TemplateConfigResult | undefined | null | void>;
	/**
	 * Called when a new Handlebars instance is created for template rendering.
	 * Use this to register custom helpers or partials on the hbs instance.
	 */
	onHandlebarsCreated?: (params: OnHandlebarsCreatedHookParams) => MaybePromise<void>;
}
export interface HandleApi {
	(apiDescriptor: ApiDescriptor): ApiDescriptor | void | undefined | null;
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
	path: string;
}
/**
 * Options for globals template
 */
export interface GlobalsTemplateOptions {
	/**
	 * Globally exported api name, you can access the automatically generated api globally through this name.
	 * Default is 'Apis'. Required when multiple generators are configured, and cannot be repeated.
	 */
	global?: string;
	/**
	 * The host object of global mounting, default is `globalThis`, it means `window` in browser and `global` in nodejs
	 * @default 'globalThis'
	 */
	globalHost?: string;
	/**
	 * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
	 * @default false
	 */
	useImportType?: boolean;
}
/**
 * Options for functional template
 */
export interface FunctionalTemplateOptions {
	/**
	 * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
	 * @default false
	 */
	useImportType?: boolean;
}
/**
 * Options for axios/fetch/ky templates
 */
export interface RequestLibTemplateOptions {
	/**
	 * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
	 * @default false
	 */
	useImportType?: boolean;
}
/**
 * Performance tuning options for code generation.
 */
export interface PerformanceConfig {
	/** schema→TS worker pool strategy. Default 'auto' (adaptive by API count) */
	workerPool?: "auto" | number | false;
	/** Max concurrency for transform phase. Default auto (min(64, max(8, cpus*4))) */
	transformConcurrency?: number;
	/** Max parallelism for file writes. Default 32 */
	writeConcurrency?: number;
	/** Apply prettier formatting to final files before write. Default true (schema-level prettier is always disabled) */
	prettierFinal?: boolean;
	/** Sort tags/APIs/components alphabetically for deterministic output. Default true */
	deterministicSort?: boolean;
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
	input?: string | string[];
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
	 * The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.
	 * @requires true
	 */
	output?: string;
	/**
	 * Whether to generate documentation comments, default is true.
	 * Set to false to improve generation performance.
	 * @default true
	 */
	docComment?: boolean;
	/**
	 * Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 2xx status code.
	 * Can be a string or an array of strings for fallback media types.
	 * @default 'application/json'
	 */
	responseMediaType?: string | string[];
	/**
	 * Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body.
	 * Can be a string or an array of strings for fallback media types.
	 * @default 'application/json'
	 */
	bodyMediaType?: string | string[];
	/**
	 * Custom server name for displaying in the sidebar when multiple API docs are configured.
	 * Default names are server1, server2, server3...
	 */
	serverName?: string;
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
	 * When there is no require, it defaults to require, and only nullable takes effect.
	 */
	defaultRequire?: boolean;
	/**
	 * plugin will be executed before `handleApi`
	 */
	plugins?: ApiPlugin[];
	/**
	 * Performance tuning options for code generation.
	 */
	performance?: PerformanceConfig;
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
}
export type OpenAPIDocument = OpenAPIV3_1.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export interface Api {
	tag: string;
	method: string;
	summary: string;
	path: string;
	pathParameters: string;
	queryParameters: string;
	pathParametersComment?: string;
	queryParametersComment?: string;
	responseComment?: string;
	requestBodyComment?: string;
	name: string;
	response: string;
	requestBody?: string;
	defaultValue?: string;
	pathKey: string;
}
export interface ApiDoc {
	apis: Api[];
	tagName: string;
}
export type ApiDescriptor = Omit<OperationObject, "requestBody" | "parameters" | "responses"> & {
	url: string;
	method: string;
	parameters?: Parameter[];
	refNameMap?: Record<string, string>;
	requestBody?: SchemaObject;
	responses?: SchemaObject;
};
export interface TemplateData {
	title: OpenAPIDocument["info"]["title"];
	openapi: OpenAPIDocument["openapi"];
	version: OpenAPIDocument["info"]["version"];
	description: OpenAPIDocument["info"]["description"];
	contact: OpenAPIDocument["info"]["contact"];
	/** Framework tag: vue | react | svelte | solid-js | nuxt */
	framework?: string;
	defaultKey?: boolean;
	baseUrl: string;
	/** Schema/Component definitions */
	components: string[];
	/** Names of all generated component schemas (keys of schemasMap) */
	componentNames: string[];
	/** All apis array */
	allApis: Api[];
	/** Apis grouped by tag */
	tagedApis: ApiDoc[];
	type: TemplateType;
	/** Config passed from template configuration */
	config: Record<string, any>;
}
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
export interface AiDocConfig {
	template?: string;
	outputDir?: string;
}
export declare function aiDoc(config?: AiDocConfig): ApiPlugin;
export type ScopeType = "ALL" | "SELECTED_ENDPOINTS" | "SELECTED_TAGS" | "SELECTED_FOLDERS";
export interface APIFoxBody {
	scope?: {
		type?: ScopeType;
		selectedEndpointIds?: number[];
		selectedTags?: string[];
		selectedFolderIds?: number[];
		excludedByTags?: string[];
	};
	options?: {
		includeApifoxExtensionProperties?: boolean;
		addFoldersToTags?: boolean;
	};
	oasVersion?: "2.0" | "3.0" | "3.1";
	exportFormat?: "JSON" | "YAML";
	environmentIds?: number[];
	branchId?: number;
	moduleId?: number;
}
export interface ApifoxOptions extends Pick<APIFoxBody, "oasVersion" | "exportFormat" | "environmentIds" | "branchId" | "moduleId">, Pick<NonNullable<APIFoxBody["options"]>, "includeApifoxExtensionProperties" | "addFoldersToTags"> {
	projectId: string;
	apifoxToken: string;
	locale?: string;
	apifoxVersion?: string;
	scopeType?: ScopeType;
	selectedEndpointIds?: number[];
	selectedTags?: string[];
	selectedFolderIds?: number[];
	excludedByTags?: string[];
}
export declare function apifox({ projectId, locale, apifoxVersion, scopeType, selectedEndpointIds, selectedTags, selectedFolderIds, excludedByTags, apifoxToken, oasVersion, exportFormat, includeApifoxExtensionProperties, addFoldersToTags, environmentIds, branchId, moduleId, }: ApifoxOptions): ApiPlugin;
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
export interface ImportTypeOptions {
	imports: Record<string, string[]>;
	files?: string[];
}
export declare function importType(imports: Record<string, string[]>, options?: {
	files?: string[];
}): ApiPlugin;
declare enum ModifierScope {
	PARAMS = "params",
	PATH_PARAMS = "pathParams",
	DATA = "data",
	RESPONSE = "response"
}
export type SchemaPrimitive = "number" | "string" | "boolean" | "undefined" | "null" | "unknown" | "any" | "never" | ({} & string);
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
	type?: SchemaPrimitive;
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
 * Supported platform types
 */
export type PlatformType = "swagger" | "knife4j" | "fastapi" | "yapi";
/**
 * Platform plugin for auto-resolving OpenAPI file URLs.
 *
 * Pass a platform type (e.g., `'swagger'`) and the plugin will use `config.input`
 * as the base URL to generate candidate OpenAPI file URLs. The framework will try
 * each URL in order and use the first successful response.
 *
 * @param platformType - The platform type: 'swagger' | 'knife4j' | 'fastapi' | 'yapi'
 * @returns ApiPlugin
 *
 * @example
 * ```ts
 * import { platform, alovaGlobals } from '@alova/wormhole/plugin';
 *
 * defineConfig({
 *   generator: [{
 *     input: 'https://petstore3.swagger.io',
 *     plugins: [platform('swagger'), alovaGlobals()],
 *     output: './src/api',
 *   }]
 * });
 * ```
 */
export declare function platform(platformType: PlatformType): ApiPlugin;
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
	transform?: (apiDescriptor: ApiDescriptor, value: string) => string;
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
/**
 * alova.config 模板预设 - plugin mode
 */
export declare function config(): ApiPlugin;
/**
 * globals 模板预设 - plugin mode
 * 全局模板，现有的全局模板，通过全局挂载的方式使用
 */
export declare function alovaGlobals(opts?: GlobalsTemplateOptions): ApiPlugin;
/**
 * functional 模板预设 - plugin mode
 * 函数式模板，生成函数式API调用，支持tree-shaking，仅支持alova v3
 */
export declare function alova(opts?: FunctionalTemplateOptions): ApiPlugin;
/**
 * axios 模板预设 - plugin mode
 * Axios相关模板
 */
export declare function axios(opts?: RequestLibTemplateOptions): ApiPlugin;
/**
 * fetch 模板预设 - plugin mode
 * Fetch相关模板
 */
declare function fetch$1(opts?: RequestLibTemplateOptions): ApiPlugin;
/**
 * ky 模板预设 - plugin mode
 * Ky相关模板
 */
export declare function ky(opts?: RequestLibTemplateOptions): ApiPlugin;

export {
	fetch$1 as fetch,
};

export {};
