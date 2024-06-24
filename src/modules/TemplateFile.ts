import fs from 'node:fs';
import path from 'node:path';
import { TemplateData } from '../functions/openApi2Data';
import { format, generateFile, readAndRenderTemplate } from '../utils';
import { srcPath } from '../utils/path';
export const TEMPLATE_DATA = new Map<string, TemplateData>();
export class TemplateFile {
  fileName: string;
  type: TemplateType;
  constructor(type: TemplateType) {
    // 根据type确定使用哪个模板文件夹下的模板
    this.type = type;
  }
  //获取生成文件的后缀名
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
  async outputFile(
    data: Record<string, any>,
    fileName: string,
    ouput: string,
    config?: { ext?: string; root?: boolean; outFileName?: string }
  ) {
    // 这里实现模板文件渲染工作，例如返回文件内容和文件名，然后再写入output的文件夹
    const renderContent = await this.readAndRenderTemplate(fileName, data, config);
    await generateFile(ouput, `${config?.outFileName ?? fileName}${config?.ext ?? this.getExt()}`, renderContent);
  }
  readAndRenderTemplate(fileName: string, data: any, config?: { root?: boolean }) {
    const filePath = config?.root ? fileName : `${this.type}/${fileName}`;
    const templatePath = path.resolve(srcPath, `templates/${filePath}.handlebars`);
    return readAndRenderTemplate(templatePath, data);
  }
}

export const writeAlovaJson = async (data: TemplateData, originPath: string, name = 'alova.json') => {
  // 将数据转换为 JSON 字符串
  const jsonData = await format(JSON.stringify(data, null, 2), { parser: 'json' });

  // 定义 JSON 文件的路径和名称
  const filePath = path.join(originPath, `./${name}`);
  if (!fs.existsSync(originPath)) {
    fs.mkdirSync(originPath, { recursive: true });
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
export const readAlovaJson = (originPath: string) => {
  // 定义 JSON 文件的路径和名称
  const filePath = path.join(originPath, './alova.json');
  return new Promise<TemplateData>((resolve, reject) => {
    // 使用 fs.readFile 读取 JSON 文件
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        TEMPLATE_DATA.delete(originPath);
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};
