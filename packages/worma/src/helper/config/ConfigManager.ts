import type { Config } from './type'
import type { ProgressTracker } from '@/helper/progress'
import { fromError } from 'zod-validation-error'
import prepareConfig from '@/functions/prepareConfig'
import { generatorHelper } from '@/helper/config/GeneratorHelper'
import { logger } from '@/helper/logger'
import { zConfig } from './zType'

export class ConfigManager {
  private config: Config
  private readConfig: Readonly<Config>

  private readonly defaultConfig: Config = Object.freeze({
    generator: [],
  })

  private readonly defaultGeneratorConfig = generatorHelper.getDefaultConfig()
  constructor() {
    this.config = this.defaultConfig
  }

  /**
   * 加载并验证配置
   */
  public async load(config: Partial<Config>, projectPath: string = process.cwd(), tracker?: ProgressTracker): Promise<void> {
    // 处理配置
    const userConfig = await this.handleConfig(config, projectPath, tracker)
    // 验证配置
    const validatedConfig = this.validateConfig(userConfig)

    // 更新配置
    this.config = validatedConfig
    this.readConfig = Object.freeze(this.config)
    logger.debug('Configuration loaded successfully', this.config)
  }

  /**
   * 获取完整配置
   */
  public getConfig() {
    return this.readConfig
  }

  /**
   * 更新配置
   */
  public async update(partialConfig: Partial<Config>): Promise<void> {
    await this.load({ ...this.config, ...partialConfig })
  }

  private async handleConfig(config: Partial<Config>, projectPath: string = process.cwd(), tracker?: ProgressTracker) {
    // 合并配置
    const userConfig = this.mergeConfig(this.defaultConfig, config)
    // 处理插件的config配置
    userConfig.generator = await Promise.all(userConfig.generator.map(item => prepareConfig(item, projectPath, tracker)))
    return userConfig
  }
  /**
   * 验证配置
   */

  private validateConfig(config: unknown): Config {
    let result = config as Config
    try {
      result = zConfig.parse(config)
    }
    catch (error) {
      const zError = fromError(error)
      throw logger.throwError(zError.message, zError.details)
    }
    return result
  }

  /**
   * 合并配置（浅拷贝）
   */
  private mergeConfig<T extends Config>(defaultConfig: T, userConfig: Partial<T>): T {
    const result = { ...defaultConfig, ...userConfig } as T
    if (userConfig.generator) {
      result.generator = userConfig.generator.map(config => ({
        ...this.defaultGeneratorConfig,
        ...config,
      }))
    }
    return result
  }
}
