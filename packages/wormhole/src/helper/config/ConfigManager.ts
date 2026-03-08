import type { Config } from './type'
import { fromError } from 'zod-validation-error'
import prepareConfig from '@/functions/prepareConfig'
import { logger } from '@/helper'
import { generatorHelper } from '@/helper/config/GeneratorHelper'
import { zConfig } from './zType'

export class ConfigManager {
  private static instance: ConfigManager
  private config: Config
  private readConfig: Readonly<Config>

  private readonly defaultConfig: Config = Object.freeze({
    generator: [],
    autoUpdate: true,
  })

  private readonly defaultGeneratorConfig = generatorHelper.getDefaultConfig()
  private constructor() {
    this.config = this.defaultConfig
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * 加载并验证配置
   */
  public async load(config: Partial<Config>): Promise<void> {
    // 处理配置
    const userConfig = await this.handleConfig(config)
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

  private async handleConfig(config: Partial<Config>) {
    // 合并配置
    const userConfig = this.mergeConfig(this.defaultConfig, config)
    // 处理插件的config配置
    userConfig.generator = await Promise.all(userConfig.generator.map(item => prepareConfig(item)))
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

// 导出单例实例
export const configManager = ConfigManager.getInstance()
