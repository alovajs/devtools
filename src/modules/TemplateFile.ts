import Error from '@/components/error';
import { AlovaVersion } from '@/functions/getAlovaVersion';
import { TemplateData } from '@/functions/openApi2Data';
import { ALOVA_TEMP_PATH, TEMPLATE_PATH } from '@/globalConfig';
import { format, generateFile, readAndRenderTemplate } from '@/utils';
import type { TemplateType } from '@/wormhole';
import { cloneDeep, merge } from 'lodash';
import fs from 'node:fs';
import path from 'node:path';

export const TEMPLATE_DATA = new Map<string, TemplateData>();
export const getAlovaJsonPath = (workspaceRootDir: string, outputPath: string) =>
  path.join(workspaceRootDir, ALOVA_TEMP_PATH, outputPath.split(/\/|\\/).join('_'));
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
export class TemplateFile {
  fileName: string;

  type: TemplateType;

  alovaVersion: AlovaVersion;

  constructor(type: TemplateType, alovaVersion: AlovaVersion) {
    // 根据type确定使用哪个模板文件夹下的模板
    this.type = type;
    this.alovaVersion = alovaVersion;
  }

  // 获取生成文件的后缀名
  getExt() {
    return TemplateFile.getExt(this.type);
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

  private getVersion() {
    switch (this.alovaVersion) {
      case 'v3':
        return 'v3-';
      default:
        return '';
    }
  }

  readAndRenderTemplate(fileName: string, data: any, userConfig?: RenderTemplateOptions) {
    const config = merge(cloneDeep(DEFAULT_OPTIONS), userConfig);
    const fileVersion = config.hasVersion ? this.getVersion() : '';
    const filePath = config?.root ? fileVersion + fileName : `${this.type}/${fileVersion}${fileName}`;
    const templatePath = path.resolve(TEMPLATE_PATH, `./${filePath}.handlebars`);
    return readAndRenderTemplate(templatePath, data);
  }
}

export const writeAlovaJson = async (data: TemplateData, originPath: string, name = 'api.json') => {
  // 将数据转换为 JSON 字符串
  const jsonData = await format(JSON.stringify(data, null, 2), { parser: 'json' });
  // 定义 JSON 文件的路径和名称
  const filePath = `${originPath}_${name}`;
  const dirPath = filePath.split(/\/|\\/).slice(0, -1).join('/');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  // 使用 fs.writeFile 将 JSON 数据写入文件
  fs.writeFile(filePath, jsonData, err => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('JSON file has been saved.');
    }
  });
};
export const readAlovaJson = (originPath: string, name = 'api.json') => {
  // 定义 JSON 文件的路径和名称
  const filePath = `${originPath}_${name}`;
  return new Promise<TemplateData>((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error('alovaJson not exists'));
      return;
    }
    // 使用 fs.readFile 读取 JSON 文件
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};
