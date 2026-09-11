import { MethodType, RequestBody } from 'alova';
import { OpenAPIV3_1 } from 'openapi-types';
import { FormatConfig as OxfmtFormatConfig } from 'oxfmt';
import { z } from 'zod/v3';

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
export interface BeforeSpecParseHookParams {
	config: Readonly<GeneratorConfig>;
	/** The raw OpenAPI specification text (JSON or YAML), before it is parsed. */
	spec: string;
	projectPath: string;
	reportProgress: ReportProgress;
}
export interface SpecParsedHookParams {
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
/** Parameters for the convenience renderTemplate function passed to codeGenerated hook */
export interface RenderTemplateParams {
	templatePath: string;
	type: TemplateType;
	outputDir: string;
	data: TemplateData;
	options?: {
		changedTags?: Set<string>;
		beforeFileWrite?: (params: {
			filePath: string;
			content: string;
			meta: {
				templateType?: "tag" | "api";
				tag?: string;
				api?: string;
			};
		}) => MaybePromise<string>;
		writeConcurrency?: number;
		formatFile?: boolean;
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
	/** Convenience: render a template to a directory in one call */
	renderTemplate: (params: RenderTemplateParams) => Promise<{
		filePaths: string[];
	}>;
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
	 * Called after the raw OpenAPI spec text is fetched but before it is parsed.
	 * Return a (possibly modified) string to replace the spec text that will be
	 * parsed. Returning nothing keeps the original spec text.
	 */
	beforeSpecParse?: (params: BeforeSpecParseHookParams) => MaybePromise<string | undefined | null | void>;
	/**
	 * Manipulate the openapi document after parsing.
	 * Returning null does NOT replacing anything.
	 */
	specParsed?: (params: SpecParsedHookParams) => MaybePromise<OpenAPIDocument | undefined | null | void>;
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
	/**
	 * Sort the collected component types alphabetically so the output order stays
	 * stable regardless of worker scheduling. `false` keeps collection order.
	 * Default true
	 */
	deterministicSort?: boolean;
}
/**
 * 生成产物的格式化配置。
 *
 * 除 `enabled` 外的所有字段都是 oxfmt 原生选项，worma 不做校验、原样透传给 oxfmt，
 * 由 oxfmt 自行校验；类型提示直接来自 oxfmt，因此随 oxfmt 版本自动保持同步。
 *
 * @example
 * ```js
 * // 关闭格式化
 * format: { enabled: false }
 *
 * // 自定义风格
 * format: { printWidth: 100, trailingComma: 'all', semi: false }
 * ```
 */
export interface FormatOptions extends OxfmtFormatConfig {
	/**
	 * 是否格式化生成的代码，默认 true。
	 */
	enabled?: boolean;
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
	/**
	 * 生成产物的格式化配置（基于 oxfmt），对所有 generator 生效。
	 * 除 `enabled` 外的字段原样透传给 oxfmt，worma 不做额外校验。
	 *
	 * @example
	 * ```js
	 * format: { enabled: false }
	 * format: { printWidth: 100, trailingComma: 'all', semi: false }
	 * ```
	 */
	format?: FormatOptions;
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
	callingCode?: string;
}
export interface ApiDoc {
	apis: Api[];
	tag: string;
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
/** Id and aggregated row counts of a change record persisted by one `generate()` run. */
export interface RecordedChangeInfo {
	/** Zero-padded record id, e.g. `"0007"` */
	id: string;
	added: number;
	removed: number;
	modified: number;
}
export interface GenerateApiOptions {
	projectPath?: string;
	/** Per-generator lifecycle callback. Receives a discriminated union of {@link GeneratorProgressEvent}. */
	onProgress?: (event: GeneratorProgressEvent) => void;
	/**
	 * Called once when this run persisted a change record, with its id and
	 * aggregated counts. Never called when the source document did not change,
	 * so callers can tell "source updated" apart from "nothing to record".
	 */
	onChangeRecorded?: (change: RecordedChangeInfo) => void;
}
export type SourceStatus = "unchanged" | "changed" | "new" | "error";
export interface SourceUpdateInfo {
	/** Index inside `config.generator` */
	index: number;
	output: string;
	serverName?: string;
	status: SourceStatus;
	/** The URL / file that actually served the spec — also the cache key */
	resolvedInput?: string;
	/** Normalized hash of the raw spec text */
	hash?: string;
	error?: string;
}
export interface CheckUpdatesResult {
	projectPath: string;
	updates: SourceUpdateInfo[];
	hasChanges: boolean;
	/**
	 * Whether the project already carries a generation baseline (any index entry
	 * with a non-empty `tags` map). Lets callers decide whether a `new` source is
	 * worth surfacing: a brand-new project must stay silent on its first run,
	 * while an established project that gained a source should be noticed.
	 */
	hasGenerationBaseline: boolean;
}
/**
 * Detect whether the configured OpenAPI sources changed since the last
 * recorded baseline.
 *
 * This is a **source-level, side-effect free** check:
 *
 * - it only hashes the raw spec text — no parsing, no plugin hooks;
 * - it only reads/writes the `source` sub-field of `index.json` entries, never
 *   the generation-side `hash` / `tags`;
 * - when no baseline exists yet (`new`) it writes the baseline silently and
 *   does *not* report a change (first run must not nag the user).
 *
 * Nothing on the user's disk is rewritten — callers decide what to do with the
 * result (the VS Code extension asks for confirmation before generating).
 */
export declare function checkUpdates(config: Config, options?: {
	projectPath?: string;
}): Promise<CheckUpdatesResult>;
declare const DEFAULT_CONFIG: {
	cacheDir: string;
	/** Overrides cacheDir's parent directory for monorepo unified cache. */
	cacheRoot: string | undefined;
	/**
	 * Maximum number of `changes/<NNNN>.json` records to keep.
	 * `0` (or any non-positive value) keeps every record.
	 */
	changeHistoryLimit: number;
	/** 用户自定义的产物格式化配置，未设置时使用内置默认值 */
	format: FormatOptions | undefined;
	Error: ErrorConstructor;
	templateData: Map<string, any>;
};
export declare function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>): void;
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
 * Structural diff of the **source** OpenAPI document.
 *
 * The baseline is the document parsed from the `beforeSpecParse` output, i.e.
 * taken *before* the `specParsed` hooks run: it is the source file as authored,
 * not the plugin-normalised document that generation consumes. Every difference
 * is reported as a flat {@link SourceChange} row so a caller (the CLI table, the
 * editor webview, a CI script) can render it without any further shaping.
 *
 * Design notes:
 * - `$ref`s are deliberately **not** inlined: the record is a source view, so a
 *   component change is reported once under `#/components/...`, with the
 *   affected operations attached as `affects` (resolved through the reverse
 *   `$ref` index, including transitive references) so the impact stays visible
 *   without duplicating the row.
 * - Description-ish keys are still recorded (they are source changes) but get
 *   the `doc` level so callers can de-emphasise them.
 */
/** Category of a change row. */
export type ChangeKind = "api" | "param" | "body" | "resp" | "comp" | "meta";
/** `+` added, `-` removed, `~` modified. */
export type ChangeOp = "+" | "-" | "~";
/** Coarse severity, used for ordering and colour only. */
export type ChangeLevel = "breaking" | "additive" | "doc";
/** One flattened source-document change. */
export interface SourceChange {
	op: ChangeOp;
	kind: ChangeKind;
	/** `GET /pets`, `#/components/schemas/Pet` or `#/info` */
	target: string;
	/** Location inside the target, e.g. `query.status.schema.enum` */
	item?: string;
	/** Short description, e.g. `createPet -> addPet` or `+"sold"` */
	detail?: string;
	level: ChangeLevel;
	/**
	 * Operations affected by a `comp` change, rendered as a list next to the
	 * change (one per line). Always absent for non-component kinds.
	 */
	affects?: string[];
}
/**
 * Diff two source documents and return the flattened change rows.
 *
 * Returns an empty array when the documents are structurally identical, so the
 * caller can decide not to write a change record at all.
 */
export declare function diffSourceDocument(before: unknown, after: unknown): SourceChange[];
/** Alias accepted by {@link getChange} — resolves to the newest record. */
export declare const LATEST_CHANGE_ID = "latest";
/** One generator's (output's) contribution to a change record. */
export interface ChangeItem {
	output: string;
	serverName?: string;
	/** URL / file that served the spec this record was built from */
	resolvedInput?: string;
	/** Flattened source-document changes (see `diffSourceDocument`) */
	changes: SourceChange[];
}
/** Aggregated row counts of a change record. */
export interface ChangeCounts {
	added: number;
	removed: number;
	modified: number;
}
/** Lightweight list entry returned by {@link listChanges}. */
export interface ChangeSummary {
	id: string;
	createdAt: number;
	summary: {
		generators: number;
	} & ChangeCounts;
	outputs: string[];
}
/** A full change record — one `generate()` run aggregated. */
export interface Change {
	/** Record schema; `1` for the source-document view (absent on legacy records) */
	schemaVersion?: number;
	id: string;
	createdAt: number;
	projectPath: string;
	generators: ChangeItem[];
}
/** Aggregate the change rows of every generator into flat counts. */
export declare function countChanges(generators: ChangeItem[]): ChangeCounts;
/**
 * List recorded changes, newest first.
 *
 * Sorted by `createdAt` (id as tie-breaker) rather than by file name: an id is
 * only chronological as long as `index.json#changeSeq` never resets, and a
 * reset would otherwise make a brand-new record show up last.
 */
export declare function listChanges(projectPath: string): Promise<ChangeSummary[]>;
/**
 * Read a single change record.
 *
 * @param projectPath absolute path of the project root
 * @param id `"0007"` or the alias `"latest"` (newest record)
 */
export declare function getChange(projectPath: string, id: string): Promise<Change | undefined>;
/** A newly added or removed API (identified by `method` + `path`). */
export interface ApiChange {
	method: string;
	path: string;
	name?: string;
	tag?: string;
}
/** An API that still exists but whose definition changed. */
export interface ApiFieldChange extends ApiChange {
	/** Names of the fields whose value differs between the two versions */
	changedFields: string[];
}
export interface ApiDiffResult {
	added: ApiChange[];
	removed: ApiChange[];
	modified: ApiFieldChange[];
}
/**
 * Stable matching key for an API.
 *
 * `method` + `path` is used instead of `name` because it survives function
 * renames: a renamed API is reported as *modified* rather than
 * removed + added.
 */
export declare function apiDiffKey(api: Pick<Api, "method" | "path">): string;
/**
 * Diff two API lists at API level.
 *
 * @param oldApis API list as of the previous generation (from cache)
 * @param newApis API list parsed from the current spec
 */
export declare function diffApis(oldApis?: Api[], newApis?: Api[]): ApiDiffResult;
/**
 * The source document as of the last successful generation.
 *
 * It is captured **before** the `specParsed` hooks run, so the snapshot is the
 * source file the user authored (after `beforeSpecParse`), not the document the
 * plugin pipeline turns it into.
 */
export interface SourceSnapshot {
	version: number;
	/** URL / file that served the spec */
	resolvedInput?: string;
	/** Hash of the stable-stringified document */
	hash: string;
	updatedAt: number;
	/** The stable-stringified document, parsed back into a plain value */
	doc: unknown;
}
/** Stable hash of a stable-stringified source document. */
export declare function sourceDocumentHash(documentText: string): string;
/** Read one generator's last source snapshot. */
export declare function readSourceSnapshot(projectRoot: string, outputPath: string): Promise<SourceSnapshot | null>;
/** Persist one generator's source snapshot. */
export declare function writeSourceSnapshot(projectRoot: string, outputPath: string, snapshot: SourceSnapshot): Promise<void>;
/**
 * Generate relevant API information based on the configuration object.
 *
 * When `options.onProgress` is provided, each generator independently reports
 * its lifecycle via {@link GeneratorProgressEvent} discriminated union events.
 *
 * @param config generating config
 * @param options config rules that contains `projectPath`, `onProgress`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
export declare function generate(config: Config, options?: GenerateApiOptions): Promise<boolean[]>;
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LoggerOptions {
	level: LogLevel;
	prefix?: string;
	timestamp?: boolean;
	colors?: boolean;
}
declare class Logger$1 {
	private options;
	configure(options: Partial<LoggerOptions>): this;
	private getTimestamp;
	private formatMessage;
	private shouldLog;
	debug(message: string, details?: unknown): void;
	info(message: string, details?: unknown): void;
	warn(message: string, details?: unknown): void;
	private errorMsg;
	error(message: string, details?: unknown): void;
	throwError(error: string | Error, details?: unknown): Error;
}
export declare const logger: Logger$1;
/**
 * Read the worma.config configuration file and return the parsed configuration object.
 * @param projectPath The project path where the configuration file is located. The default value is `process.cwd()`.
 * @returns a promise instance that contains configuration object.
 */
export declare function readConfig(projectPath?: string): Promise<Config>;
/**
 * Get cached API docs. Cache is self-describing — no config needed.
 * In monorepo, pass ANY sub-package path; cache is always read from the unified cacheRoot.
 * @param outputs Optional filter: only return entries matching these output paths.
 *                If omitted, returns ALL cached entries (including all monorepo sub-projects).
 * @param projectPath Project root, defaults to `process.cwd()`.
 */
export declare function getApiDocs(outputs?: string[], projectPath?: string): Promise<CacheData[]>;
/**
 * Search for all directories containing worma.config configuration files under the monorepo project. It will search for configuration files based on `workspaces` in `package.json` or sub packages defined in `pnpm-workspace.yaml`
 * @param projectPath The project path to search, defaults to `process.cwd()`.
 * @returns An array of relative paths to directories containing worma.config configuration files.
 */
export function resolveWorkspaces(projectPath?: string): Promise<string[]>;

export {};
