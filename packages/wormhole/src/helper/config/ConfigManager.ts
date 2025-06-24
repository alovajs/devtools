import { logger } from '@/helper';
import { generatorHelper } from '@/helper/config/GeneratorHelper';
import { isArray, isObject, mergeWith, omit } from 'lodash';
import { fromError } from 'zod-validation-error';
import type { Config, GeneratorConfig } from './type';
import { zConfig } from './zType';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private readConfig: Readonly<Config>;

  private readonly defaultConfig: Config = Object.freeze({
    generator: [],
    autoUpdate: true
  });
  private readonly defaultGeneratorConfig: GeneratorConfig = omit(generatorHelper.getDefaultConfig(), ['global']);
  private readonly defaultOneGeneratorConfig: GeneratorConfig = generatorHelper.getDefaultConfig();
  private constructor() {
    this.config = this.defaultConfig;
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 加载并验证配置
   */
  public async load(config: Partial<Config>): Promise<void> {
    // 合并配置
    const mergedConfig = this.mergeConfig(this.defaultConfig, config);
    // 验证配置
    const validatedConfig = this.validateConfig(mergedConfig);
    // 更新配置
    this.config = validatedConfig;
    this.readConfig = Object.freeze(this.config);
    logger.debug('Configuration loaded successfully', this.config);
  }

  /**
   * 获取完整配置
   */
  public getConfig() {
    return this.readConfig;
  }

  /**
   * 更新配置
   */
  public async update(partialConfig: Partial<Config>): Promise<void> {
    await this.load({ ...this.config, ...partialConfig });
  }

  /**
   * 验证配置
   */
  // eslint-disable-next-line class-methods-use-this
  private validateConfig(config: unknown): Config {
    let result = config as Config;
    try {
      result = zConfig.parse(config);
    } catch (error) {
      const zError = fromError(error);
      throw logger.throwError(zError.message, zError.details);
    }
    return result;
  }

  /**
   * 深度合并配置
   */
  private mergeConfig<T extends Config>(defaultConfig: T, userConfig: Partial<T>): T {
    const merged = { ...defaultConfig } as T;
    const mergeHandle =
      (root = '') =>
      (defaultValue: unknown, userValue: unknown, key: string) => {
        if (!root && key === 'generator' && isArray(userValue)) {
          return userValue.map((generatorConfig: GeneratorConfig, idx) =>
            mergeWith(
              { ...(userValue.length > 1 ? this.defaultGeneratorConfig : this.defaultOneGeneratorConfig) },
              generatorConfig,
              mergeHandle(root ? `${root}.${key}.${idx}` : `${key}.${idx}`)
            )
          );
        }
        if (Array.isArray(userValue)) {
          return userValue; // 源数组优先级最高
        }
        if (isObject(defaultValue) && isObject(userValue)) {
          return mergeWith(defaultValue, userValue, mergeHandle(root ? `${root}.${key}` : key));
        }
      };
    const result = mergeWith(merged, userConfig, mergeHandle());
    return result;
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance();
