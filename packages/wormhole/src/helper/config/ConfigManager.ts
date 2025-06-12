import { logger } from '@/helper';
import { isArray, isObject, mergeWith } from 'lodash';
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
  private readonly defaultGeneratorConfig: GeneratorConfig = Object.freeze({
    input: '',
    output: '',
    responseMediaType: 'application/json',
    bodyMediaType: 'application/json',
    type: 'auto',
    globalHost: 'globalThis',
    useImportType: false,
    defaultRequire: false
  });
  private readonly defaultOneGeneratorConfig: GeneratorConfig = Object.freeze({
    ...this.defaultGeneratorConfig,
    global: 'Apis'
  });
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
    const validatedConfig = await this.validateConfig(mergedConfig);
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
  private async validateConfig(config: unknown): Promise<Config> {
    return zConfig.parse(config);
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
