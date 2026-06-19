import { MethodType, RequestBody } from 'alova';
import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod/v3';

declare const DEFAULT_CONFIG: {
	cacheDir: string;
	Error: ErrorConstructor;
	templateData: Map<string, any>;
};
export declare function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>): void;
export type OpenAPIDocument = OpenAPIV3_1.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
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
	 * Replaces or manipulates the options object passed to worma.
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
export interface Config {
	/**
	 * API generation settings are arrays. Each item represents an automatically generated rule, including the generated input and output directories, specification file addresses, etc.
	 * Currently, only OpenAPI specifications are supported, including OpenAPI 2.0 and 3.0 specifications.
	 */
	generator: GeneratorConfig[];
}
export type UserConfig = Config;
export type UserConfigFnObject = () => UserConfig;
export type UserConfigFnPromise = () => Promise<UserConfig>;
export type UserConfigFn = () => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFnObject | UserConfigFnPromise | UserConfigFn;
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
	/** Global namespace name (e.g. 'Apis') for globals template mode */
	global?: string;
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
 * Standardized cache data for VSCode extension
 * Used for rendering sidebar API tree and quick search
 */
export interface CacheData {
	path: string;
	/** Server name displayed in sidebar */
	serverName?: string;
	/** All APIs as a flat array */
	apis: Api[];
}
/**
 * Per-generator progress event.
 *
 * Emitted by `generate()` (when `onProgress` is provided) for each
 * generator in the config, covering the full lifecycle:
 *
 *   active → progress → done/failed/skipped
 *
 * Use TypeScript's discriminated union on `phase` to narrow the event type.
 *
 * @example
 * generate(config, {
 *   onProgress(event) {
 *     switch (event.phase) {
 *       case 'active':   renderer.setActive(event.index); break
 *       case 'progress': renderer.setProgress(event.index, event.progress, event.message); break
 *       case 'done':     renderer.setDone(event.index); break
 *       case 'skipped':  renderer.setSkipped(event.index); break
 *       case 'failed':   renderer.setFailed(event.index, event.error); break
 *     }
 *   }
 * })
 */
export type GeneratorProgressEvent = {
	/** 0-based index in config.generator[] */
	index: number;
} & ({
	phase: "active";
} | {
	phase: "progress";
	/** 0–100 percentage */
	progress: number;
	/** Human-readable stage (e.g. 'parsing openapi document') */
	message: string;
	/** Source of the progress event. `'core'` for the framework lifecycle, otherwise the plugin name. */
	source?: string;
} | {
	phase: "done"; /** The actual URL that was successfully parsed (may differ from config.input) */
	resolvedInput?: string;
} | {
	phase: "skipped"; /** The actual URL that was successfully parsed (may differ from config.input) */
	resolvedInput?: string;
} | {
	phase: "failed";
	error: string;
});
export interface GenerateApiOptions {
	force?: boolean;
	projectPath?: string;
	/** Per-generator lifecycle callback. Receives a discriminated union of {@link GeneratorProgressEvent}. */
	onProgress?: (event: GeneratorProgressEvent) => void;
}
export type TemplatePreset = "alova" | "alovaGlobals" | "axios" | "fetch" | "ky";
export interface ConfigCreationOptions {
	projectPath?: string;
	type?: TemplateType;
	template?: TemplatePreset;
}
export declare function createConfig({ projectPath, type, template }?: ConfigCreationOptions): Promise<void>;
/**
 * Type helper to make it easier to use worma.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 */
export declare function defineConfig(config: UserConfig): UserConfig;
export declare function defineConfig(config: Promise<UserConfig>): Promise<UserConfig>;
export declare function defineConfig(config: UserConfigFnObject): UserConfigFnObject;
export declare function defineConfig(config: UserConfigFnPromise): UserConfigFnPromise;
export declare function defineConfig(config: UserConfigFn): UserConfigFn;
export declare function defineConfig(config: UserConfigExport): UserConfigExport;
/**
 * Generate relevant API information based on the configuration object.
 *
 * When `options.onProgress` is provided, each generator independently reports
 * its lifecycle via {@link GeneratorProgressEvent} discriminated union events.
 *
 * @param config generating config
 * @param options config rules that contains `force`, `projectPath`, `onProgress`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
export declare function generate(config: Config, options?: GenerateApiOptions): Promise<boolean[]>;
/**
 * Read the worma.config configuration file and return the parsed configuration object.
 * @param projectPath The project path where the configuration file is located. The default value is `process.cwd()`.
 * @returns a promise instance that contains configuration object.
 */
export declare function readConfig(projectPath?: string): Promise<Readonly<Config>>;
export declare function getApiDocs(config: Config, projectPath?: string): Promise<CacheData[]>;
/**
 * Search for all directories containing worma.config configuration files under the monorepo project. It will search for configuration files based on `workspaces` in `package.json` or sub packages defined in `pnpm-workspace.yaml`
 * @param projectPath The project path to search, defaults to `process.cwd()`.
 * @returns An array of relative paths to directories containing worma.config configuration files.
 */
export function resolveWorkspaces(projectPath?: string): Promise<string[]>;

export {};
