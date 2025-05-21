import type { AlovaVersion } from '@/functions/getAlovaVersion';
import type { TemplateType } from '@/type/base';
import { generateFile, readAndRenderTemplate } from '@/utils';
import { cloneDeep, merge } from 'lodash';

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
    // Determine which template folder to use based on type.

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

  // Get the suffix name of the generated file

  getExt() {
    return TemplateFile.getExt(this.type);
  }

  // Get module type

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
    // Here, the template file rendering work is implemented, such as returning the file content and file name, and then writing it to the output folder.

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
