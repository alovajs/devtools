import { cloneDeep, merge } from 'lodash';
import type { TemplateType } from '..';
import type { AlovaVersion } from '../functions/getAlovaVersion';
import { generateFile, readAndRenderTemplate } from '../utils';

interface RenderTemplateOptions {
  root?: boolean;
  hasVersion?: boolean;
  ext?: string;
  outFileName?: string;
}
const DEFAULT_OPTIONS = {
  root: false,
  hasVersion: true
};

export default class TemplateFile {
  type: TemplateType;

  alovaVersion: AlovaVersion;

  constructor(type: TemplateType, alovaVersion: AlovaVersion) {
    // 根据type确定使用哪个模板文件夹下的模板
    this.type = type;
    this.alovaVersion = alovaVersion;
  }

  private getVersion() {
    switch (this.alovaVersion) {
      case 'v3':
        return 'v3-';
      default:
        return '';
    }
  }

  // 获取生成文件的后缀名
  getExt() {
    return TemplateFile.getExt(this.type);
  }

  // 获取模块类型
  getModuleType() {
    return TemplateFile.getModuleType(this.type);
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

  async outputFile(data: Record<string, any>, fileName: string, ouput: string, config?: RenderTemplateOptions) {
    // 这里实现模板文件渲染工作，例如返回文件内容和文件名，然后再写入output的文件夹
    const renderContent = await this.readAndRenderTemplate(fileName, data, config);
    await generateFile(ouput, `${config?.outFileName ?? fileName}${config?.ext ?? this.getExt()}`, renderContent);
  }

  readAndRenderTemplate(fileName: string, data: any, userConfig?: RenderTemplateOptions) {
    const config = merge(cloneDeep(DEFAULT_OPTIONS), userConfig);
    const fileVersion = config.hasVersion ? this.getVersion() : '';
    const filePath = config?.root ? fileVersion + fileName : `${this.type}/${fileVersion}${fileName}`;
    return readAndRenderTemplate(filePath, data);
  }
}
