import type { ProgressTracker } from '@/helper/progress'
import type { ApiPlugin, GeneratorConfig, TemplateType } from '@/type'
import path from 'node:path'
import { fromError } from 'zod-validation-error'
import { ConfigTypeEnum, TemplateTypeEnum } from '@/constant'
import { openApiParser, TemplateParser } from '@/core/parser'
import { computePerTagHashes, diffChangedTags, getCacheEntry } from '@/functions/alovaJson'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { logger, PluginDriver, TemplateHelper } from '@/helper'
import { CORE_PROGRESS_SOURCE, noopReportProgress } from '@/helper/progress'
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
    // Merge with default config
    const mergedConfig = { ...this.defaultConfig, ...config }
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

  static async generate(
    config: GeneratorConfig,
    { projectPath, force, tracker }: {
      projectPath: string
      force?: boolean
      tracker?: ProgressTracker
    },
  ) {
    const reporter = (plugin: ApiPlugin) =>
      tracker?.reporterFor(plugin.name ?? 'plugin') ?? noopReportProgress
    const pluginDriver = new PluginDriver(config.plugins, { reporter })
    const reportCore = (progress: number, message?: string) => {
      tracker?.update(CORE_PROGRESS_SOURCE, progress, message)
    }

    logger.debug('Starting generation process', {
      projectPath,
      force,
    })
    reportCore(5, 'starting')

    const frozenConfig = Object.freeze(config)

    // Plugin: handle before parse openapi
    reportCore(10, 'beforeOpenapiParse')
    await pluginDriver.hookParallelEach('beforeOpenapiParse', () => ({
      config: frozenConfig,
      projectPath,
    }))

    reportCore(20, 'parsing openapi document')
    let document = await this.openApiData(config, projectPath)
    if (!document) {
      logger.debug('No OpenAPI document found, skipping generation')
      reportCore(100, 'skipped: no openapi document')
      return false
    }

    logger.debug('OpenAPI document parsed successfully')
    reportCore(35, 'openapi parsed')

    // Plugin: handle after parse openapi (openapiParsed)
    const openapiParsed = await pluginDriver.hookSeqEach('openapiParsed', (_p, prevResult, _ctx) => {
      if (prevResult) {
        document = prevResult
      }
      return {
        config: frozenConfig,
        document,
        projectPath,
      }
    })
    if (openapiParsed) {
      document = openapiParsed
    }
    reportCore(45, 'openapiParsed')

    const output = path.resolve(projectPath, config.output!)
    const templateType = await GeneratorHelper.getTemplateType(config, projectPath)

    // Get template path from plugins (last non-nil wins)
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
        const fn = (plugin as any).onHandlebarsCreated as Function
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
    const newApis = templateData.allApis || []
    const newHashInfo = computePerTagHashes(newApis)
    let changedTags: Set<string> | undefined

    if (!force) {
      const oldEntry = await getCacheEntry(projectPath, config.output!)
      if (oldEntry) {
        if (oldEntry.hash === newHashInfo.hash) {
          logger.debug('Template data unchanged (hash match), skipping generation')
          reportCore(100, 'skipped: template data unchanged')
          return false
        }
        // Compute which tags changed for incremental rendering
        changedTags = diffChangedTags(oldEntry.tags, newHashInfo.tags)
        logger.debug('Incremental update detected', {
          totalTags: Object.keys(newHashInfo.tags).length,
          changedTags: changedTags.size,
        })
      }
    }

    reportCore(70, 'beforeCodeGenerate')
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
      const result = await templateHelper.generateFromTemplateDir(
        templateResult.path,
        output,
        templateData,
        {
          changedTags,
          writeConcurrency: perf?.writeConcurrency ?? 32,
          prettierFinal: perf?.prettierFinal ?? true,
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
      logger.debug('Template generation completed')
      reportCore(95, 'files written')
    }
    catch (error) {
      codeGenError = error as Error
    }

    // 9.1.4 & 9.1.1: codeGenerated is called AFTER all files are written, only receives file paths
    await pluginDriver.hookParallelEach('codeGenerated', () => ({
      config: frozenConfig,
      data: templateData,
      filePaths,
      outputDir: output,
      projectPath,
      error: codeGenError,
    }))

    if (!codeGenError) {
      reportCore(100, 'completed')
    }
    else {
      reportCore(100, `failed: ${codeGenError.message}`)
      throw codeGenError
    }

    return true
  }
}

export const generatorHelper = GeneratorHelper.getInstance()
