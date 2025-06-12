import { getGlobalConfig } from '@/config';
import { getAlovaJsonPath, readAlovaJson, writeAlovaJson } from '@/functions/alovaJson';
import type { AlovaVersion, TemplateData, TemplateType } from '@/type';
import { generateFile, readAndRenderTemplate } from '@/utils';
import { cloneDeep, merge } from 'lodash';

const DEFAULT_CONFIG = getGlobalConfig();
interface RenderTemplateOptions {
  root?: boolean;
  hasVersion?: boolean;
  ext?: string;
  outFileName?: string;
}
export interface OutputFileOptions extends RenderTemplateOptions {
  fileName: string;
  data: Record<string, any>;
  output: string;
}
const DEFAULT_OPTIONS = {
  root: false,
  hasVersion: true
};
interface TemplateConfig {
  version: AlovaVersion;
  type: TemplateType;
}
export class TemplateHelper {
  private static instance: TemplateHelper;
  private config: TemplateConfig;
  public static getInstance(): TemplateHelper {
    if (!TemplateHelper.instance) {
      TemplateHelper.instance = new TemplateHelper();
    }
    return TemplateHelper.instance;
  }
  private constructor(config?: TemplateConfig) {
    if (config) {
      this.config = config;
    }
  }
  public load(config: TemplateConfig) {
    this.config = config;
    return this;
  }

  static load(config: TemplateConfig) {
    return new TemplateHelper(config);
  }

  private getVersion() {
    switch (this.config.version) {
      case 'v3':
        return 'v3-';
      default:
        return '';
    }
  }

  // Get the suffix name of the generated file

  getExt() {
    return TemplateHelper.getExt(this.config.type);
  }

  // Get module type

  getModuleType() {
    return TemplateHelper.getModuleType(this.config.type);
  }
  static async readData(projectPath: string, output: string) {
    const alovaJsonPath = getAlovaJsonPath(projectPath, output);
    try {
      const alovaJson = await readAlovaJson(alovaJsonPath);
      DEFAULT_CONFIG.templateData.set(alovaJsonPath, alovaJson);
      return alovaJson;
    } catch {
      DEFAULT_CONFIG.templateData.delete(alovaJsonPath);
      return {} as TemplateData;
    }
  }
  static getData(projectPath: string, output: string) {
    return DEFAULT_CONFIG.templateData.get(getAlovaJsonPath(projectPath, output));
  }
  static setData(templateData: TemplateData, projectPath: string, output: string) {
    return writeAlovaJson(templateData, getAlovaJsonPath(projectPath, output));
  }
  static getExt(type: TemplateType) {
    switch (type) {
      case 'typescript':
        return '.ts';
      default:
        return '.js';
    }
  }

  static getModuleType(type: TemplateType) {
    switch (type) {
      case 'typescript':
      case 'module':
        return 'ESModule';
      default:
        return 'commonJs';
    }
  }

  async outputFile(options: OutputFileOptions) {
    return generateFile(
      options.output,
      `${options?.outFileName ?? options.fileName}${options?.ext ?? this.getExt()}`,
      await this.readAndRenderTemplate(options.fileName, options.data, options)
    );
  }

  readAndRenderTemplate(fileName: string, data: any, userConfig?: RenderTemplateOptions) {
    const config = merge(cloneDeep(DEFAULT_OPTIONS), userConfig);
    const fileVersion = config.hasVersion ? this.getVersion() : '';
    const filePath = config?.root ? fileVersion + fileName : `${this.config.type}/${fileVersion}${fileName}`;
    return readAndRenderTemplate(filePath, data);
  }
  async outputFiles(optionsArray: (OutputFileOptions | null)[]) {
    return Promise.all(optionsArray.filter(item => !!item).map(options => this.outputFile(options)));
  }
}

export const templateHelper = TemplateHelper.getInstance();
