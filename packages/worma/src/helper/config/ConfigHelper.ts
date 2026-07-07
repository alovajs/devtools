import type { ProgressTracker } from '@/helper/progress'
import type { Config, GeneratorConfig, UserConfigExport } from '@/type'
import { isArray } from 'lodash'
import { TemplateHelper } from '@/helper'
import { logger } from '@/helper/logger'
import { ConfigManager } from './ConfigManager'
import { GeneratorHelper } from './GeneratorHelper'

export class ConfigHelper {
  private static instance: ConfigHelper
  private configManager = ConfigManager.getInstance()
  private projectPath: string
  public static getInstance(): ConfigHelper {
    if (!ConfigHelper.instance) {
      ConfigHelper.instance = new ConfigHelper()
    }
    return ConfigHelper.instance
  }

  public async load(config: Partial<Config>, projectPath = process.cwd(), tracker?: ProgressTracker): Promise<void> {
    this.projectPath = projectPath
    logger.debug('ConfigHelper.load — loading config manager', { projectPath, generatorCount: config.generator?.length ?? 0 })
    await this.configManager.load(config, projectPath, tracker)
    logger.debug('ConfigHelper.load — reading cache data')
    await this.readAlovaJson()
    logger.debug('ConfigHelper.load — complete')
  }

  public async readUserConfig(userConfig: UserConfigExport) {
    if (typeof userConfig === 'function') {
      return await userConfig()
    }
    return Promise.resolve(userConfig)
  }

  public getConfig() {
    return this.configManager.getConfig()
  }

  public getProjectPath() {
    return this.projectPath
  }

  public getTemplateType(idx?: number | number[]) {
    const { generator } = this.configManager.getConfig()
    const templateType = (config: GeneratorConfig) =>
      GeneratorHelper.getTemplateType(config, this.projectPath)
    if (isArray(idx)) {
      return generator.filter((_, index) => idx.includes(index)).map(item => templateType(item))
    }
    if (idx !== undefined && idx < generator.length && idx >= 0) {
      return [templateType(generator[idx])]
    }
    return generator.map(item => templateType(item))
  }

  public getOutput() {
    return this.configManager.getConfig().generator.map(item => item.output)
  }

  public getOpenApiData() {
    return Promise.all(
      this.configManager
        .getConfig()
        .generator.map(item => GeneratorHelper.openApiData(item, this.projectPath)),
    )
  }

  public async generate(options: { force?: boolean, tracker?: ProgressTracker }) {
    const { tracker, force } = options
    const results = await Promise.all(
      this.configManager.getConfig().generator.map(item =>
        GeneratorHelper.generate(item, {
          force,
          projectPath: this.projectPath,
          tracker,
        }),
      ),
    )
    // Flush all in-memory cache entries to disk once after all generators complete,
    // avoiding race conditions from parallel writes to the same .alova-cache.json.
    await TemplateHelper.flushAllData(this.projectPath)
    return results.map(r => r.success)
  }

  private readAlovaJson() {
    const allAlovaJSon = this.configManager
      .getConfig()
      .generator
      .map(async item => TemplateHelper.readData(this.projectPath, item.output!))
    return Promise.all(allAlovaJSon)
  }
}

export const configHelper = ConfigHelper.getInstance()
