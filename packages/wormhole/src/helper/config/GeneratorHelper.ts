import type { GeneratorConfig, TemplateConfig, TemplateConfigResult, TemplateData, TemplateType } from '@/type'
import path from 'node:path'
import { isEqual } from 'lodash'
import { fromError } from 'zod-validation-error'
import { openApiParser, TemplateParser } from '@/core/parser'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { logger, PluginDriver, TemplateHelper } from '@/helper'
import { zGeneratorConfig, zTemplateResult } from './zType'

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
    type: 'auto',
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
  public getTemplateType(projectPath: string) {
    return GeneratorHelper.getTemplateType(this.config, projectPath)
  }

  public getPluginDriver() {
    return this.pluginDriver
  }

  public openApiData(projectPath: string) {
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
  static getTemplateType(config: GeneratorConfig, projectPath: string): TemplateType {
    let type: TemplateType
    const configType = config.type ?? 'auto'

    switch (configType) {
      case 'ts':
      case 'typescript':
        type = 'typescript'
        break
      case 'module':
        type = 'module'
        break
      case 'auto':
        type = getAutoTemplateType(projectPath)
        break
      default:
        type = 'commonjs'
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
      platformType: config.platform,
      fetchOptions: config.fetchOptions,
    })
  }

  static async getTemplateConfig(templateCofig: TemplateConfig): Promise<Required<TemplateConfigResult>> {
    return zTemplateResult.parse(await templateCofig())
  }

  static async generate(
    config: GeneratorConfig,
    options: {
      projectPath: string
      force?: boolean
    },
  ) {
    const pluginDriver = new PluginDriver(config.plugins)

    logger.debug('Starting generation process', {
      projectPath: options.projectPath,
      force: options.force,
    })

    // Plugin: handle before parse openapi
    await pluginDriver.hookParallel('beforeOpenapiParse', [Object.freeze(config)])

    let document = await this.openApiData(config, options.projectPath)
    if (!document) {
      logger.debug('No OpenAPI document found, skipping generation')
      return false
    }

    logger.debug('OpenAPI document parsed successfully')

    // Plugin: handle after parse openapi
    document
      = (await pluginDriver.hookSeq('afterOpenapiParse', [document], (result, args) => {
        return result ? [result] : args
      })) ?? document

    const output = path.resolve(options.projectPath, config.output!)
    const templateType = this.getTemplateType(config, options.projectPath)
    const templateConfig = await this.getTemplateConfig(config.template)

    logger.debug('Template configuration loaded', {
      path: templateConfig.path,
      type: templateType,
    })

    const templateHelper = TemplateHelper.load({
      type: templateType,
      templatePath: templateConfig.path,
      templateConfig: templateConfig.config,
    })

    // Parse document and create template data
    const templateData = await new TemplateParser().parse(document, {
      projectPath: options.projectPath,
      generatorConfig: config,
    })

    logger.debug('Template data parsed', {
      apisCount: templateData.apis?.length ?? 0,
      tagsCount: templateData.tagedApis?.length ?? 0,
    })

    const oldCacheData = TemplateHelper.getData(options.projectPath, config.output!)

    // Check if generation is needed by comparing apis
    const newApis = templateData.tagedApis || []
    const oldApis = oldCacheData?.apis || []
    if (!options.force && isEqual(newApis, oldApis)) {
      logger.debug('Template data unchanged, skipping generation')
      return false
    }

    let codeGenError: Error | undefined
    try {
      await this.generateWithTemplate({
        config,
        templateHelper,
        templateData,
        output,
        projectPath: options.projectPath,
      })
    }
    catch (error) {
      codeGenError = error as Error
    }

    // Plugin: handle after code generate
    await pluginDriver.hookParallel('afterCodeGenerate', [codeGenError])
    return true
  }

  private static async generateWithTemplate(params: {
    config: GeneratorConfig
    templateHelper: TemplateHelper
    templateData: TemplateData
    output: string
    projectPath: string
  }) {
    const { config, templateHelper, templateData, output, projectPath } = params
    const templateConfig = await this.getTemplateConfig(config.template)

    logger.debug('Resolving template files', { templatePath: templateConfig.path })

    // Save template data and cache data
    await TemplateHelper.setData(templateData, projectPath, config.output!, config)

    logger.debug('Processing templates')

    // Use the unified generateFromTemplateDir method
    await templateHelper.generateFromTemplateDir(templateConfig.path, output, templateData)

    logger.debug('Template generation completed')
  }
}

export const generatorHelper = GeneratorHelper.getInstance()
