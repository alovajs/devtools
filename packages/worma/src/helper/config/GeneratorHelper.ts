import type { MaybePromise, RenderTemplateParams } from './type'
import type { ChangeItem } from '@/functions/changeReport'
import type { ProgressTracker } from '@/helper/progress'
import type { ApiPlugin, GeneratorConfig, TemplateType } from '@/type'
import path from 'node:path'
import { fromError } from 'zod-validation-error'
import { ConfigTypeEnum, TemplateTypeEnum } from '@/constant'
import { openApiParser, TemplateParser } from '@/core/parser'
import { getOpenApiDataWithUrl } from '@/core/parser/openApiParser/helper'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { collectSourceChanges } from '@/functions/sourceSnapshot'
import {
  computePerTagHashes,
  computeSpecHash,
  diffChangedTags,
  getCacheEntry,
  hasGenerationBaseline,
  stableStringify,
  updateSourceBaseline,
} from '@/functions/wormaJson'
import { logger, PluginDriver, TemplateHelper } from '@/helper'
import { CORE_PROGRESS_SOURCE, noopReportProgress } from '@/helper/progress'
import { isFormatEnabled } from '@/utils/format'
import { zGeneratorConfig } from './zType'

export class GeneratorHelper {
  private static instance: GeneratorHelper
  private config: GeneratorConfig
  private readConfig: Readonly<GeneratorConfig>
  private pluginDriver: PluginDriver

  /**
   * Default configuration values
   */
  private readonly defaultConfig: Partial<GeneratorConfig> = Object.freeze({
    input: '',
    output: '',
    responseMediaType: 'application/json',
    bodyMediaType: 'application/json',
    type: ConfigTypeEnum.AUTO,
    defaultRequire: false,
    /**
     * `transformConcurrency` is intentionally omitted: leaving it unset means
     * "auto" (`min(64, max(8, cpus*4))`), which the parser resolves at runtime.
     */
    performance: {
      workerPool: 'auto' as const,
      writeConcurrency: 32,
      deterministicSort: true,
    },
  })

  public static getInstance(): GeneratorHelper {
    if (!GeneratorHelper.instance) {
      GeneratorHelper.instance = new GeneratorHelper()
    }
    return GeneratorHelper.instance
  }

  public static load(config: GeneratorConfig) {
    const ins = new GeneratorHelper()
    return ins.load(config)
  }

  public getConfig() {
    return this.readConfig
  }

  public getDefaultConfig(): Partial<GeneratorConfig> {
    return this.defaultConfig
  }

  /**
   * Load and validate configuration
   * @param config - Partial generator configuration
   * @returns GeneratorHelper instance
   */
  public async load(config: Partial<GeneratorConfig>) {
    // Merge with default config. `performance` is an object, so a plain spread
    // would drop the per-field defaults as soon as the user sets only part of it.
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
      performance: { ...this.defaultConfig.performance, ...config.performance },
    }
    // Validate configuration
    const validatedConfig = await GeneratorHelper.validateConfig(mergedConfig)
    // Update config
    this.config = validatedConfig
    this.readConfig = Object.freeze(this.config)
    this.pluginDriver = new PluginDriver(this.config.plugins)
    return this
  }

  /**
   * Get template type based on config
   * @param projectPath - Project path
   * @returns Template type
   */
  public async getTemplateType(projectPath: string) {
    return GeneratorHelper.getTemplateType(this.config, projectPath)
  }

  public getPluginDriver() {
    return this.pluginDriver
  }

  public async openApiData(projectPath: string) {
    return GeneratorHelper.openApiData(this.config, projectPath)
  }

  /**
   * Validate configuration using zod schema
   * @param config - Configuration to validate
   * @returns Validated configuration
   */
  static async validateConfig(config: unknown): Promise<GeneratorConfig> {
    let result = config as GeneratorConfig
    try {
      result = zGeneratorConfig.parse(config)
    }
    catch (error) {
      const zError = fromError(error)
      throw logger.throwError(zError.message, zError.details)
    }
    return result
  }

  /**
   * Determine template type based on config type value
   * @param config - Generator configuration
   * @param projectPath - Project path for auto detection
   * @returns Template type
   */
  static async getTemplateType(config: GeneratorConfig, projectPath: string): Promise<TemplateType> {
    let type: TemplateType
    const configType = config.type ?? ConfigTypeEnum.AUTO

    switch (configType) {
      case ConfigTypeEnum.TS:
      case ConfigTypeEnum.TYPESCRIPT:
        type = TemplateTypeEnum.TYPESCRIPT
        break
      case ConfigTypeEnum.MODULE:
        type = TemplateTypeEnum.MODULE
        break
      case ConfigTypeEnum.AUTO:
        type = await getAutoTemplateType(projectPath)
        break
      default:
        type = TemplateTypeEnum.COMMONJS
        break
    }
    return type
  }

  /**
   * Parse OpenAPI document from config input
   * @param config - Generator configuration
   * @param projectPath - Project path
   * @returns OpenAPI document
   */
  static openApiData(config: GeneratorConfig, projectPath: string) {
    return openApiParser.parse(config.input!, {
      projectPath,
      fetchOptions: config.fetchOptions,
    })
  }

  static async openApiDataWithUrl(
    config: GeneratorConfig,
    projectPath: string,
    opts?: { beforeSpecParse?: (spec: string) => MaybePromise<string | undefined | null | void> },
  ) {
    return getOpenApiDataWithUrl(config.input!, {
      projectPath,
      fetchOptions: config.fetchOptions,
      beforeSpecParse: opts?.beforeSpecParse,
    })
  }

  static async generate(
    config: GeneratorConfig,
    { projectPath, tracker }: {
      projectPath: string
      tracker?: ProgressTracker
    },
  ): Promise<{
    success: boolean
    resolvedInput?: string
    /** API-level diff of this generator, only present when something changed */
    change?: ChangeItem
  }> {
    const reporter = (plugin: ApiPlugin) =>
      tracker?.reporterFor(plugin.name ?? 'plugin') ?? noopReportProgress
    const pluginDriver = new PluginDriver(config.plugins, { reporter })
    const reportCore = (progress: number, message?: string) => {
      tracker?.update(CORE_PROGRESS_SOURCE, progress, message)
    }

    const pluginCount = (config.plugins || []).length
    const pluginNames = (config.plugins || []).map(p => p.name).filter(Boolean)
    logger.debug('Starting generation process', {
      projectPath,
      input: config.input,
      output: config.output,
      plugins: pluginCount,
      pluginNames: pluginNames.length ? pluginNames : 'none',
    })
    reportCore(5, 'starting')

    const frozenConfig = Object.freeze(config)

    reportCore(10, 'beforeSpecParse')
    logger.debug('Fetching and parsing OpenAPI document', { input: config.input })
    reportCore(20, 'parsing openapi document')
    const openApiResult = await this.openApiDataWithUrl(config, projectPath, {
      // Plugin: beforeSpecParse — receives the raw spec string, may return a modified string
      beforeSpecParse: (spec: string) =>
        pluginDriver.hookPipe('beforeSpecParse', spec, (_p, current, _ctx) => ({
          config: frozenConfig,
          spec: current,
          projectPath,
        })),
    })
    let document = openApiResult.data
    const resolvedInput = openApiResult.resolvedUrl
    if (!document) {
      logger.debug('No OpenAPI document found, skipping generation', { resolvedInput })
      reportCore(100, 'skipped: no openapi document')
      return { success: false, resolvedInput }
    }

    // Requirement: the change baseline is the **source** document — the one
    // parsed from the `beforeSpecParse` output, taken before the `specParsed`
    // hooks run. `document` is the very object those hooks receive and they may
    // mutate it in place, so the snapshot has to be taken right here.
    const sourceDocumentText = stableStringify(document)

    logger.debug('OpenAPI document parsed successfully', {
      resolvedUrl: resolvedInput,
      version: (document as any)?.info?.version,
      paths: Object.keys((document as any)?.paths || {}).length,
    })
    reportCore(35, 'specParsed')

    // Plugin: handle after parse openapi (specParsed)
    logger.debug('Running specParsed hook', { pluginCount })
    const specParsed = await pluginDriver.hookSeqEach('specParsed', (_p, prevResult, _ctx) => {
      if (prevResult) {
        document = prevResult
      }
      return {
        config: frozenConfig,
        document,
        projectPath,
      }
    })
    if (specParsed) {
      document = specParsed
      logger.debug('specParsed hook modified document')
    }
    reportCore(45, 'specParsed')

    const output = path.resolve(projectPath, config.output!)
    const templateType = await GeneratorHelper.getTemplateType(config, projectPath)
    logger.debug('Resolved output and template type', { output, templateType })

    // Get template path from plugins (last non-nil wins)
    logger.debug('Running getTemplate hook')
    const templateResult = await pluginDriver.hookSeqEach('getTemplate', (_p, _prevResult, _ctx) => ({
      config: frozenConfig,
      projectPath,
    }))
    if (!templateResult?.path) {
      throw logger.throwError('No template configured. Please add a template preset plugin (e.g. alovaGlobals, alova, axios, fetch, ky) to `config.generator.plugins`.')
    }

    logger.debug('Template configuration loaded', {
      path: templateResult.path,
      type: templateType,
    })
    reportCore(55, 'template configuration loaded')

    // Collect onHandlebarsCreated callbacks from plugins (deferred until hbs is created)
    const onHbsCreatedCallbacks: Array<(hbs: any) => void | Promise<void>> = []
    const plugins = (config.plugins || []) as ApiPlugin[]
    for (const plugin of plugins) {
      if (typeof (plugin as any).onHandlebarsCreated === 'function') {
        const fn = (plugin as any).onHandlebarsCreated as (...args: any[]) => any
        onHbsCreatedCallbacks.push((hbs: any) =>
          fn.call(plugin, {
            hbs,
            config: frozenConfig,
            projectPath,
            reportProgress: reporter(plugin),
          }),
        )
      }
    }

    const templateHelper = TemplateHelper.load({
      type: templateType,
      templatePath: templateResult.path,
      // We'll collect and inject onHandlebarsCreated later
    })

    // Parse document and create template data
    const tempalteParser = new TemplateParser()
    const templateData = await tempalteParser.parse(document, {
      projectPath,
      generatorConfig: config,
    })

    logger.debug('Template data parsed', {
      apisCount: templateData.allApis?.length ?? 0,
      tagsCount: templateData.tagedApis?.length ?? 0,
    })
    reportCore(65, 'template data parsed')

    // M3-B2: hash-based comparison instead of lodash.isEqual O(n·s) deep compare
    // P2: Pass tagedApis to avoid re-grouping; apiHashCache avoids re-hashing same Api objects
    const newApis = templateData.allApis || []
    const newHashInfo = computePerTagHashes(newApis, templateData.tagedApis)

    // `generate()` is "call means generate": there is deliberately NO whole-run
    // skip here any more. Change detection is `checkUpdates()`'s job; rendering
    // stays incremental (only changed tags are re-rendered) as a pure
    // optimization that does not alter the output.
    const oldEntry = await getCacheEntry(projectPath, config.output!)
    let changedTags: Set<string> | undefined
    if (hasGenerationBaseline(oldEntry)) {
      changedTags = diffChangedTags(oldEntry!.tags, newHashInfo.tags)
      logger.debug('Incremental update detected', {
        totalTags: Object.keys(newHashInfo.tags).length,
        changedTags: changedTags.size,
      })
    }
    else {
      logger.debug('No render baseline — rendering every tag')
    }

    reportCore(70, 'beforeCodeGenerate')
    logger.debug('Running beforeCodeGenerate hook')
    await pluginDriver.hookParallelEach('beforeCodeGenerate', () => ({
      config: frozenConfig,
      data: templateData,
      projectPath,
    }))

    let codeGenError: Error | undefined
    let filePaths: string[] = []
    try {
      // Reload templateHelper with onHandlebarsCreated callbacks
      templateHelper.load({
        type: templateType,
        templatePath: templateResult.path,
        onHandlebarsCreated: onHbsCreatedCallbacks,
      })

      logger.debug('Resolving template files', { templatePath: templateResult.path })

      // Save template data and cache data (hash info included for later write)
      await TemplateHelper.setData(templateData, projectPath, config.output!, config)

      logger.debug('Processing templates')
      reportCore(80, 'processing templates')

      // 9.2.1: Unified streaming pipeline — render + beforeFileWrite hooks + write
      const perf = config.performance
      const writeConcurrency = perf?.writeConcurrency ?? 32
      const formatFile = isFormatEnabled()
      logger.debug('Starting template generation', {
        writeConcurrency,
        formatFile,
        changedTagsCount: changedTags?.size ?? 'all',
      })
      const result = await templateHelper.generateFromTemplateDir(
        templateResult.path,
        output,
        templateData,
        {
          changedTags,
          writeConcurrency,
          formatFile,
          beforeFileWrite: async ({ filePath: relPath, content: fileContent, meta }) => {
            return pluginDriver.hookPipe('beforeFileWrite', fileContent, (_p, currentContent, _ctx) => ({
              config: frozenConfig,
              data: templateData,
              filePath: relPath,
              content: currentContent,
              projectPath,
              meta,
            }))
          },
        },
      )
      filePaths = result.filePaths
      logger.debug('Template generation completed', {
        filesWritten: filePaths.length,
      })
      reportCore(95, 'files written')
    }
    catch (error) {
      codeGenError = error as Error
      logger.debug('Template generation failed', {
        error: codeGenError.message,
        stack: codeGenError.stack,
      })
    }

    // 9.1.4 & 9.1.1: codeGenerated is called AFTER all files are written, only receives file paths
    logger.debug('Running codeGenerated hook', { fileCount: filePaths.length })
    await pluginDriver.hookParallelEach('codeGenerated', () => ({
      config: frozenConfig,
      data: templateData,
      filePaths,
      outputDir: output,
      projectPath,
      error: codeGenError,
      renderTemplate: (params: RenderTemplateParams) => TemplateHelper.renderToDir(params),
    }))

    if (!codeGenError) {
      reportCore(100, 'completed')
    }
    else {
      reportCore(100, `failed: ${codeGenError.message}`)
      throw codeGenError
    }

    // Requirement A: refresh the source-level baseline with the very same raw
    // text that was just parsed — zero extra requests. Only the `source`
    // sub-field is touched, so the render baseline (`hash` / `tags`) is kept.
    if (openApiResult.rawText) {
      await updateSourceBaseline(projectPath, config.output!, {
        resolvedInput,
        rawHash: computeSpecHash(openApiResult.rawText),
        updatedAt: Date.now(),
      }, config.serverName ?? '')
    }

    // Requirement B: the source-document diff runs only **after** a successful
    // generation, so a failed run never pays for the comparison nor advances the
    // baseline the next run diffs against.
    let change: ChangeItem | undefined
    try {
      const sourceChanges = await collectSourceChanges({
        projectRoot: projectPath,
        outputPath: config.output!,
        documentText: sourceDocumentText,
        resolvedInput,
      })
      if (sourceChanges) {
        change = {
          output: config.output!,
          serverName: config.serverName || templateData.title || '',
          resolvedInput,
          changes: sourceChanges,
        }
      }
    }
    catch (error: any) {
      // Recording change history must never fail the generation itself.
      logger.debug('Failed to detect source changes', { error: error?.message })
    }

    return { success: true, resolvedInput, change }
  }
}

export const generatorHelper = GeneratorHelper.getInstance()
