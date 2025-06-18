import { openApiParser, TemplateParser } from '@/core/parser';
import getAlovaVersion from '@/functions/getAlovaVersion';
import getAutoTemplateType from '@/functions/getAutoTemplateType';
import prepareConfig from '@/functions/prepareConfig';
import { logger, TemplateHelper, type OutputFileOptions } from '@/helper';
import type { AlovaVersion, GeneratorConfig, TemplateType } from '@/type';
import { existsPromise } from '@/utils';
import { isEqual } from 'lodash';
import path from 'node:path';
import { fromError } from 'zod-validation-error';
import { zGeneratorConfig } from './zType';

export class GeneratorHelper {
  private static instance: GeneratorHelper;
  private config: GeneratorConfig;
  private readConfig: Readonly<GeneratorConfig>;
  static readonly defaultConfig: GeneratorConfig = Object.freeze({
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
    const mergedConfig = { ...GeneratorHelper.defaultConfig, ...config };
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
    let result = config as GeneratorConfig;
    try {
      result = zGeneratorConfig.parse(config);
    } catch (error) {
      const zError = fromError(error);
      throw logger.throwError(zError.message, zError.details);
    }
    return result;
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
  static async generate(
    config: GeneratorConfig,
    options: {
      projectPath: string;
      force?: boolean;
    }
  ) {
    // ! test
    config = prepareConfig(config);
    const document = await this.openApiData(config, options.projectPath);
    if (!document) {
      return false;
    }
    const output = path.resolve(options.projectPath, config.output);
    const version = GeneratorHelper.getAlovaVersion(config, options.projectPath);
    const templateHelper = TemplateHelper.load({
      type: this.getTemplateType(config, options.projectPath),
      version
    });
    const templateData = await new TemplateParser().parse(document, {
      projectPath: options.projectPath,
      generatorConfig: config
    });
    // Do you need to generate api files?

    if (!options.force && isEqual(templateData, TemplateHelper.getData(options.projectPath, config.output))) {
      return false;
    }
    await TemplateHelper.setData(templateData, options.projectPath, config.output);
    const generateFiles: OutputFileOptions[] = [
      {
        fileName: 'createApis',
        data: templateData,
        output
      },
      {
        fileName: 'apiDefinitions',
        data: templateData,
        output,
        root: true,
        hasVersion: false
      },
      {
        fileName: 'globals.d',
        data: templateData,
        output,
        ext: '.ts',
        root: true
      }
    ];
    if (!(await existsPromise(path.join(output, `index${templateHelper.getExt()}`)))) {
      generateFiles.push({
        fileName: 'index',
        data: templateData,
        output
      });
    }
    await templateHelper.outputFiles(generateFiles);
    return true;
  }
}

export const generatorHelper = GeneratorHelper.getInstance();
