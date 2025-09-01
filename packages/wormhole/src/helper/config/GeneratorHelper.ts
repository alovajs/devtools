import type { OutputFileOptions } from '@/helper'
import type { AlovaVersion, GeneratorConfig, TemplateType } from '@/type'
import path from 'node:path'
import { isEqual, pick } from 'lodash'
import { fromError } from 'zod-validation-error'
import { openApiParser, TemplateParser } from '@/core/parser'
import getAlovaVersion from '@/functions/getAlovaVersion'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import prepareConfig from '@/functions/prepareConfig'
import { logger, PluginDriver, TemplateHelper } from '@/helper'
import { existsPromise, generateFile, toCase as transformFileName } from '@/utils'
import { zGeneratorConfig } from './zType'

export class GeneratorHelper {
  private static instance: GeneratorHelper
  private config: GeneratorConfig
  private readConfig: Readonly<GeneratorConfig>
  private pluginDriver: PluginDriver
  private readonly defaultConfig: GeneratorConfig = Object.freeze({
    input: '',
    output: '',
    responseMediaType: 'application/json',
    bodyMediaType: 'application/json',
    type: 'auto',
    global: 'Apis',
    globalHost: 'globalThis',
    useImportType: false,
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

  public getDefaultConfig() {
    return this.defaultConfig
  }

  public async load(config: Partial<GeneratorConfig>) {
    // 合并配置
    const mergedConfig = { ...this.defaultConfig, ...config }
    // 验证配置
    const validatedConfig = await GeneratorHelper.validateConfig(mergedConfig)
    // 更新配置
    this.config = validatedConfig
    this.readConfig = Object.freeze(this.config)
    this.pluginDriver = new PluginDriver(this.config.plugins)
    logger.debug('GeneratorConfig loaded successfully', this.config)
    return this
  }

  public getAlovaVersion(projectPath: string) {
    return GeneratorHelper.getAlovaVersion(this.config, projectPath)
  }

  public getTemplateType(projectPath: string) {
    return GeneratorHelper.getTemplateType(this.config, projectPath)
  }

  public getPluginDriver() {
    return this.pluginDriver
  }

  public openApiData(projectPath: string) {
    return GeneratorHelper.openApiData(this.config, projectPath)
  }

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

  static getAlovaVersion(config: GeneratorConfig, projectPath: string): AlovaVersion {
    const configVersion = Number(config.version)
    return Number.isNaN(configVersion) ? getAlovaVersion(projectPath) : `v${configVersion}`
  }

  static getTemplateType(config: GeneratorConfig, projectPath: string): TemplateType {
    let type: TemplateType
    const configType = config.type ?? 'auto'
    // Determine the template type based on the type in the configuration file

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

  static openApiData(config: GeneratorConfig, projectPath: string) {
    return openApiParser.parse(config.input, {
      projectPath,
      platformType: config.platform,
    })
  }

  static async generate(
    config: GeneratorConfig,
    options: {
      projectPath: string
      force?: boolean
    },
  ) {
    // plugin: handle extends
    config = await prepareConfig(config)

    const pluginDriver = new PluginDriver(config.plugins)

    // plugin: handle before parse openapi
    const configBeforeParse = await pluginDriver.hookSeq(
      'beforeOpenapiParse',
      [pick(config, ['input', 'plugins', 'platform'])],
    )
    config = { ...config, ...(configBeforeParse ?? {}) }

    let document = await this.openApiData(config, options.projectPath)
    if (!document) {
      return false
    }

    // plugin: handle after parse openapi
    document = await pluginDriver.hookSeq('afterOpenapiParse', [document]) ?? document

    const output = path.resolve(options.projectPath, config.output)
    const version = GeneratorHelper.getAlovaVersion(config, options.projectPath)
    const templateHelper = TemplateHelper.load({
      type: this.getTemplateType(config, options.projectPath),
      version,
    })
    const templateData = await new TemplateParser().parse(document, {
      projectPath: options.projectPath,
      generatorConfig: config,
    })
    const oldTemplateData = TemplateHelper.getData(options.projectPath, config.output)
    // Transform output filename by config.fileNameCase without changing template filename
    const toCase = (name: string) => transformFileName(name, config.fileNameCase)
    // Inject computed filenames into template render data for templates to reference
    Object.assign(templateData, {
      createApisFileName: toCase('createApis'),
      apiDefinitionsFileName: toCase('apiDefinitions'),
      globalsDFileName: toCase('globals.d'),
      indexFileName: toCase('index'),
    })

    // Do you need to generate api files?
    if (!options.force && isEqual(templateData, oldTemplateData)) {
      return false
    }

    if (oldTemplateData) {
      await templateHelper.unlink([
        // Delete old API creation file
        oldTemplateData.createApisFileName ?? '',
        // Delete old API definition file
        oldTemplateData.apiDefinitionsFileName ?? '',
        // Delete old global type declaration file (.d.ts)
        {
          fileName: oldTemplateData.globalsDFileName ?? '',
          ext: '.ts',
        },
      ], { output })
    }

    await TemplateHelper.setData(templateData, options.projectPath, config.output)

    const generateFiles: OutputFileOptions[] = [
      {
        fileName: 'createApis',
        outFileName: templateData.createApisFileName,
        data: templateData,
        output,
        root: true,
        hasVersion: false,
      },
      {
        fileName: 'apiDefinitions',
        outFileName: templateData.apiDefinitionsFileName,
        data: templateData,
        output,
        root: true,
        hasVersion: false,
      },
      {
        fileName: 'globals.d',
        outFileName: templateData.globalsDFileName,
        data: templateData,
        output,
        ext: '.ts',
        root: true,
        hasVersion: false,
      },
    ]
    if (!(await existsPromise(path.join(output, `${templateData.indexFileName}${templateHelper.getExt()}`)))) {
      generateFiles.push({
        fileName: 'index',
        outFileName: templateData.indexFileName,
        data: templateData,
        output,
        root: true,
        hasVersion: false,
      })
    }

    // plugin: handle before code generate
    const unhandledGenerateFiles: OutputFileOptions[] = []
    for (const file of generateFiles) {
      const data = await pluginDriver.hookFirst('beforeCodeGenerate', [file.data, file.outFileName ?? file.fileName])
      if (!data) {
        unhandledGenerateFiles.push(file)
        return
      }

      generateFile(file.output, file.fileName, data)
    }

    await templateHelper.outputFiles(unhandledGenerateFiles)

    // plugin: handle after code gen
    await pluginDriver.hookParallel('afterCodeGenerate', [])
    return true
  }
}

export const generatorHelper = GeneratorHelper.getInstance()
