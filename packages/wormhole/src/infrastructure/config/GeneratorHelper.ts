import { openApiParser } from '@/core/parser';
import getAlovaVersion, { type AlovaVersion } from '@/functions/getAlovaVersion';
import getAutoTemplateType from '@/functions/getAutoTemplateType';
import { logger } from '@/infrastructure/logger';
import type { GeneratorConfig, TemplateType } from './types';
import { zGeneratorConfig } from './zType';

export class GeneratorHelper {
  private static instance: GeneratorHelper;
  private config: GeneratorConfig;
  private readConfig: Readonly<GeneratorConfig>;
  private readonly defaultConfig: GeneratorConfig = Object.freeze({
    input: '',
    output: '',
    responseMediaType: 'application/json',
    bodyMediaType: 'application/json',
    type: 'auto',
    global: 'Apis',
    globalHost: 'globalThis',
    useImportType: false,
    defaultRequire: false
  });
  public static getInstance(): GeneratorHelper {
    if (!GeneratorHelper.instance) {
      GeneratorHelper.instance = new GeneratorHelper();
    }
    return GeneratorHelper.instance;
  }

  public static load(config: GeneratorConfig) {
    const ins = new GeneratorHelper();
    return ins.load(config);
  }
  public getConfig() {
    return this.readConfig;
  }
  public async load(config: Partial<GeneratorConfig>) {
    // 合并配置
    const mergedConfig = { ...this.defaultConfig, ...config };
    // 验证配置
    const validatedConfig = await GeneratorHelper.validateConfig(mergedConfig);
    // 更新配置
    this.config = validatedConfig;
    this.readConfig = Object.freeze(this.config);
    logger.debug('GeneratorConfig loaded successfully', this.config);
    return this;
  }
  public getAlovaVersion(projectPath: string) {
    return GeneratorHelper.getAlovaVersion(this.config, projectPath);
  }
  public getTemplateType(projectPath: string) {
    return GeneratorHelper.getTemplateType(this.config, projectPath);
  }
  public openApiData(projectPath: string) {
    return GeneratorHelper.openApiData(this.config, projectPath);
  }

  static async validateConfig(config: unknown): Promise<GeneratorConfig> {
    return zGeneratorConfig.parse(config);
  }
  static getAlovaVersion(config: GeneratorConfig, projectPath: string): AlovaVersion {
    const configVersion = Number(config.version);
    return Number.isNaN(configVersion) ? getAlovaVersion(projectPath) : `v${configVersion}`;
  }
  static getTemplateType(config: GeneratorConfig, projectPath: string): TemplateType {
    let type: TemplateType;
    const configType = config.type ?? 'auto';
    // Determine the template type based on the type in the configuration file

    switch (configType) {
      case 'ts':
      case 'typescript':
        type = 'typescript';
        break;
      case 'module':
        type = 'module';
        break;
      case 'auto':
        type = getAutoTemplateType(projectPath);
        break;
      default:
        type = 'commonjs';
        break;
    }
    return type;
  }
  static openApiData(config: GeneratorConfig, projectPath: string) {
    return openApiParser.parse(config.input, {
      projectPath,
      platformType: config.platform
    });
  }
}

export const generatorHelper = GeneratorHelper.getInstance();
