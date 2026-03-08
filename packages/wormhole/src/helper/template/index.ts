import type { CacheData, TemplateData, TemplateType } from '@/type'
import type { GeneratorConfig } from '@/type/lib'
import fs from 'node:fs/promises'
import path from 'node:path'
import handlebars from 'handlebars'
import { getGlobalConfig } from '@/config'
import { getAlovaJsonPath, readAlovaJson, writeAlovaJson } from '@/functions/alovaJson'
import { logger } from '@/helper/logger'
import { existsPromise, registerPartials } from '@/utils'

const DEFAULT_CONFIG = getGlobalConfig()

export const MODULE_TYPES = ['typescript', 'module', 'common'] as const
export type ModuleTypeKey = (typeof MODULE_TYPES)[number]

export interface UnlickOptions {
  output: string
}

export interface UnlickFile {
  fileName: string
  ext?: string
  output?: string
}

interface TemplateConfig {
  type: TemplateType
  templatePath: string
  templateConfig: Record<string, any>
}

interface TemplateFileInfo {
  absolutePath: string
  relativePath: string
  fileName: string
  isNoOverwrite: boolean
  isTagTemplate: boolean
}

export class TemplateHelper {
  private static instance: TemplateHelper
  private config: TemplateConfig

  public static getInstance(): TemplateHelper {
    if (!TemplateHelper.instance) {
      TemplateHelper.instance = new TemplateHelper()
    }
    return TemplateHelper.instance
  }

  private constructor(config?: TemplateConfig) {
    if (config) {
      this.config = config
    }
  }

  public load(config: TemplateConfig) {
    this.config = config
    return this
  }

  static load(config: TemplateConfig) {
    return new TemplateHelper(config)
  }

  // Get the suffix name of the generated file
  getExt() {
    return TemplateHelper.getExt(this.config.type)
  }

  // Get module type
  getModuleType() {
    return TemplateHelper.getModuleType(this.config.type)
  }

  static async readData(projectPath: string, output: string) {
    const alovaJsonPath = getAlovaJsonPath(projectPath, output)
    try {
      const alovaJson = await readAlovaJson(alovaJsonPath)
      DEFAULT_CONFIG.templateData.set(alovaJsonPath, alovaJson)
      return alovaJson
    }
    catch {
      DEFAULT_CONFIG.templateData.delete(alovaJsonPath)
      return null
    }
  }

  static getData(projectPath: string, output: string): CacheData | undefined {
    return DEFAULT_CONFIG.templateData.get(getAlovaJsonPath(projectPath, output))
  }

  static setData(
    templateData: TemplateData,
    projectPath: string,
    output: string,
    config?: GeneratorConfig,
  ) {
    const alovaJsonPath = getAlovaJsonPath(projectPath, output)
    return writeAlovaJson(templateData, alovaJsonPath, 'api.json', config)
  }

  static getExt(type: TemplateType) {
    switch (type) {
      case 'typescript':
        return '.ts'
      default:
        return '.js'
    }
  }

  static getModuleType(type: TemplateType) {
    switch (type) {
      case 'typescript':
      case 'module':
        return 'ESModule'
      default:
        return 'commonJs'
    }
  }

  unlink(_files: Array<UnlickFile | string>, { output }: UnlickOptions) {
    const files: Required<UnlickFile>[] = _files.filter(Boolean).map((item) => {
      const common = {
        output,
        ext: this.getExt(),
      }
      if (typeof item === 'string') {
        return {
          fileName: item,
          ...common,
        }
      }
      return Object.assign(common, item)
    })
    return Promise.all(
      files.map(async ({ output, fileName, ext }) => {
        const filePath = path.join(output, `${fileName}${ext}`)
        if (await existsPromise(filePath)) {
          await fs.unlink(filePath)
        }
      }),
    )
  }

  // ============ 自定义模板方法 ============

  /**
   * 解析模板目录，返回需要渲染的模板文件列表
   * 支持模块类型区分（typescript/module/common）
   */
  async resolveTemplateFiles(templatePath: string): Promise<TemplateFileInfo[]> {
    const absoluteTemplatePath = path.isAbsolute(templatePath)
      ? templatePath
      : path.resolve(process.cwd(), templatePath)

    if (!(await existsPromise(absoluteTemplatePath))) {
      throw logger.throwError(`Template path not found: ${absoluteTemplatePath}`)
    }

    // 检查是否有模块类型子目录
    const hasModuleTypeDirs = await this.checkModuleTypeDirs(absoluteTemplatePath)

    if (hasModuleTypeDirs) {
      // 根据type选择对应的模块类型目录
      const moduleType = this.resolveModuleType()
      const moduleDir = path.join(absoluteTemplatePath, moduleType)

      if (await existsPromise(moduleDir)) {
        return this.scanTemplateFiles(moduleDir, '')
      }
      throw logger.throwError(`Module type directory not found: ${moduleDir}`)
    }

    // 没有模块类型区分，扫描所有子目录作为独立模板
    return this.scanAllTemplateDirs(absoluteTemplatePath)
  }

  /**
   * 检查是否存在模块类型子目录
   */
  private async checkModuleTypeDirs(templatePath: string): Promise<boolean> {
    for (const moduleType of MODULE_TYPES) {
      const moduleDir = path.join(templatePath, moduleType)
      if (await existsPromise(moduleDir)) {
        const stat = await fs.stat(moduleDir)
        if (stat.isDirectory()) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 解析模块类型
   */
  private resolveModuleType(): ModuleTypeKey {
    const type = this.config.type
    switch (type) {
      case 'typescript':
        return 'typescript'
      case 'module':
        return 'module'
      case 'commonjs':
        return 'common'
      default:
        return 'typescript'
    }
  }

  /**
   * 扫描指定目录下的模板文件
   */
  private async scanTemplateFiles(
    dir: string,
    baseRelativePath: string,
  ): Promise<TemplateFileInfo[]> {
    const files: TemplateFileInfo[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // 递归扫描子目录
        const subFiles = await this.scanTemplateFiles(
          fullPath,
          path.join(baseRelativePath, entry.name),
        )
        files.push(...subFiles)
      }
      else if (entry.isFile() && this.isTemplateFile(entry.name)) {
        const fileName = entry.name
        const isNoOverwrite = fileName.startsWith('#')
        const actualFileName = isNoOverwrite ? fileName.slice(1) : fileName
        const isTagTemplate = actualFileName.includes('{tag}')

        files.push({
          absolutePath: fullPath,
          relativePath: baseRelativePath
            ? path.join(baseRelativePath, actualFileName)
            : actualFileName,
          fileName: actualFileName,
          isNoOverwrite,
          isTagTemplate,
        })
      }
    }

    return files
  }

  /**
   * 扫描所有模板目录（没有模块类型区分时）
   */
  private async scanAllTemplateDirs(templatePath: string): Promise<TemplateFileInfo[]> {
    const files: TemplateFileInfo[] = []
    const entries = await fs.readdir(templatePath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(templatePath, entry.name)

      if (entry.isDirectory()) {
        // 每个子目录作为独立的模板集合
        const subFiles = await this.scanTemplateFiles(fullPath, entry.name)
        files.push(...subFiles)
      }
      else if (entry.isFile() && this.isTemplateFile(entry.name)) {
        // 根目录下的文件也作为模板
        const fileName = entry.name
        const isNoOverwrite = fileName.startsWith('#')
        const actualFileName = isNoOverwrite ? fileName.slice(1) : fileName
        const isTagTemplate = actualFileName.includes('{tag}')

        files.push({
          absolutePath: fullPath,
          relativePath: actualFileName,
          fileName: actualFileName,
          isNoOverwrite,
          isTagTemplate,
        })
      }
    }

    return files
  }

  /**
   * 判断是否是模板文件
   */
  private isTemplateFile(fileName: string): boolean {
    // 支持 .hbs, .handlebars, .ts, .js, .mjs, .cjs, .d.ts 等文件
    const templateExtensions = [
      '.hbs',
      '.handlebars',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.d.ts',
      '.d.cts',
      '.d.mts',
    ]
    return templateExtensions.some(ext => fileName.endsWith(ext))
  }

  /**
   * 渲染模板文件
   */
  async renderTemplate(templateFilePath: string, data: any): Promise<string> {
    // 从自定义模板路径读取
    const customPath = path.isAbsolute(this.config.templatePath)
      ? path.join(this.config.templatePath, `${templateFilePath}.handlebars`)
      : path.resolve(process.cwd(), this.config.templatePath, `${templateFilePath}.handlebars`)

    if (await existsPromise(customPath)) {
      const templateContent = await fs.readFile(customPath, 'utf-8')
      return handlebars.compile(templateContent)(data)
    }

    throw logger.throwError(`Template not found: ${templateFilePath}`)
  }

  /**
   * 从绝对路径渲染模板
   */
  async renderTemplateFromPath(absolutePath: string, data: any): Promise<string> {
    await registerPartials(this.config.templatePath)
    const templateContent = await fs.readFile(absolutePath, 'utf-8')
    return handlebars.compile(templateContent)(data)
  }

  /**
   * 根据模板文件信息生成输出文件
   */
  async generateFromTemplate(
    templateFile: TemplateFileInfo,
    outputDir: string,
    data: any,
    tags?: string[], // 用于遍历{tag}生成多个文件
  ): Promise<void> {
    const renderedContent = await this.renderTemplateFromPath(templateFile.absolutePath, data)

    if (templateFile.isTagTemplate && tags && tags.length > 0) {
      // 遍历tag生成多个文件
      for (const tag of tags) {
        const outputPath = path.join(outputDir, templateFile.relativePath.replace('{tag}', tag))

        await this.writeOutputFile(outputPath, renderedContent, false)
      }
    }
    else {
      // 单个文件生成
      const outputPath = path.join(outputDir, templateFile.relativePath)
      await this.writeOutputFile(outputPath, renderedContent, templateFile.isNoOverwrite)
    }
  }

  /**
   * 写入输出文件
   */
  async writeOutputFile(outputPath: string, content: string, skipIfExists: boolean): Promise<void> {
    if (skipIfExists && (await existsPromise(outputPath))) {
      return
    }

    // 确保目录存在
    const dir = path.dirname(outputPath)
    if (!(await existsPromise(dir))) {
      await fs.mkdir(dir, { recursive: true })
    }

    // 写入文件
    await fs.writeFile(outputPath, `${content.trim()}\n`)
  }

  /**
   * 获取模板配置参数
   */
  getTemplateConfig(): Record<string, any> {
    return this.config.templateConfig
  }

  /**
   * 从模板目录生成文件（通用方法）
   * 封装了解析模板、渲染、写入的完整流程
   * @param templatePath - 模板目录路径
   * @param outputDir - 输出目录
   * @param data - 渲染数据
   * @param options - 生成选项
   */
  async generateFromTemplateDir(
    templatePath: string,
    outputDir: string,
    data: Record<string, any>,
    options?: {
      tags?: string[]
      onBeforeRender?: (
        file: TemplateFileInfo,
        renderData: Record<string, any>
      ) => Record<string, any>
    },
  ): Promise<void> {
    const templateFiles = await this.resolveTemplateFiles(templatePath)

    if (templateFiles.length === 0) {
      throw logger.throwError(`No template files found in: ${templatePath}`)
    }

    const tags = options?.tags || data.tagedApis?.map(item => item.tag) || []

    for (const templateFile of templateFiles) {
      // 跳过已存在的 no-overwrite 文件
      if (templateFile.isNoOverwrite) {
        const outputPath = path.join(outputDir, templateFile.relativePath)
        if (await existsPromise(outputPath)) {
          continue
        }
      }

      if (templateFile.isTagTemplate && tags.length > 0) {
        for (const tag of tags) {
          const tagApis = data.tagedApis?.find(item => item.tag === tag)
          const renderData = {
            ...data,
            tagedApis: tagApis ? [tagApis] : [],
            currentTag: tag,
          }
          await this.renderAndWriteTemplateFile(templateFile, renderData, outputDir, tag)
        }
      }
      else {
        const renderData = options?.onBeforeRender
          ? options.onBeforeRender(templateFile, data)
          : data
        await this.renderAndWriteTemplateFile(templateFile, renderData, outputDir)
      }
    }
  }

  /**
   * 渲染并写入单个模板文件
   */
  private async renderAndWriteTemplateFile(
    templateFile: TemplateFileInfo,
    data: Record<string, any>,
    outputDir: string,
    tag?: string,
  ): Promise<void> {
    const renderedContent = await this.renderTemplateFromPath(templateFile.absolutePath, data)

    let relativePath = tag
      ? templateFile.relativePath.replace('{tag}', tag)
      : templateFile.relativePath

    // 移除 .handlebars 或 .hbs 扩展名
    if (relativePath.endsWith('.handlebars')) {
      relativePath = relativePath.slice(0, -'.handlebars'.length)
    }
    else if (relativePath.endsWith('.hbs')) {
      relativePath = relativePath.slice(0, -'.hbs'.length)
    }

    const outputPath = path.join(outputDir, relativePath)

    await this.writeOutputFile(outputPath, renderedContent, templateFile.isNoOverwrite)
  }
}

export const templateHelper = TemplateHelper.getInstance()
