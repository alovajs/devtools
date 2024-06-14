import path from 'path';
import { generateFile, readAndRenderTemplate } from '../utils';
import { srcPath } from '../utils/path';
export class TemplateFile {
  fileName: string;
  type: TemplateType;
  constructor(type: TemplateType) {
    // 根据type确定使用哪个模板文件夹下的模板
    this.type = type;
  }
  //获取生成文件的后缀名
  getExt() {
    switch (this.type) {
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
    generateFile(ouput, `${config?.outFileName ?? fileName}${config?.ext ?? this.getExt()}`, renderContent);
  }
  readAndRenderTemplate(fileName: string, data: any, config?: { root?: boolean }) {
    const filePath = config?.root ? fileName : `${this.type}/${fileName}`;
    const templatePath = path.resolve(srcPath, `templates/${filePath}.mustache`);
    return readAndRenderTemplate(templatePath, data);
  }
}
