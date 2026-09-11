import type { Config } from './type'
import type { ProgressTracker } from '@/helper/progress'
import { fromError } from 'zod-validation-error'
import { setGlobalConfig } from '@/config'
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
   * Load and validate the configuration
   */
  public async load(config: Partial<Config>, projectPath: string = process.cwd(), tracker?: ProgressTracker): Promise<void> {
    // process config
    const userConfig = await this.handleConfig(config, projectPath, tracker)
    // validate config
    const validatedConfig = this.validateConfig(userConfig)

    // update config
    this.config = validatedConfig
    this.readConfig = Object.freeze(this.config)
    // 同步格式化配置到全局，供 utils/format 读取。
    // 每次加载都覆盖（含 undefined），避免跨次生成或测试之间互相污染。
    setGlobalConfig({ format: validatedConfig.format })
    logger.debug('Configuration loaded successfully', this.config)
  }

  /**
   * Get the full configuration
   */
  public getConfig() {
    return this.readConfig
  }

  /**
   * Update configuration
   */
  public async update(partialConfig: Partial<Config>): Promise<void> {
    await this.load({ ...this.config, ...partialConfig })
  }

  private async handleConfig(config: Partial<Config>, projectPath: string = process.cwd(), tracker?: ProgressTracker) {
    // merge config
    const userConfig = this.mergeConfig(this.defaultConfig, config)
    // process plugin config configurations
    userConfig.generator = await Promise.all(userConfig.generator.map(item => prepareConfig(item, projectPath, tracker)))
    return userConfig
  }
  /**
   * Validate configuration
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
   * Merge configuration (shallow copy)
   */
  private mergeConfig<T extends Config>(defaultConfig: T, userConfig: Partial<T>): T {
    const result = { ...defaultConfig, ...userConfig } as T
    if (userConfig.generator) {
      result.generator = userConfig.generator.map(config => ({
        ...this.defaultGeneratorConfig,
        ...config,
        // Shallow-spreading would drop the per-field defaults when the user only
        // sets part of `performance`, so merge that object one level deep.
        performance: { ...this.defaultGeneratorConfig.performance, ...config.performance },
      }))
    }
    return result
  }
}
