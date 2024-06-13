import path from 'path';
import { generateFile, readAndRenderTemplate } from '../utils/index';

export class TemplateFile {
  fileName: string;
  projectType: 'auto' | 'ts' | 'typescript' | 'module' | 'commonjs';
  constructor(fileName: string, projectType: 'auto' | 'ts' | 'typescript' | 'module' | 'commonjs') {
    // 根据projectType确定使用哪个模板文件夹下的模板
    this.projectType = projectType;
    // 根据fileName确定当前类对应哪个文件，后缀由projectType确定
    this.fileName = fileName;
  }

  async outputFile(data: Record<string, any>, ouput: string) {
    // 这里实现模板文件渲染工作，例如返回文件内容和文件名，然后再写入output的文件夹
    const templatePath = path.resolve(__dirname, `../../src/templates/${this.projectType}/${this.fileName}.mustache`);
    const renderContent = await readAndRenderTemplate(templatePath, data);
    generateFile(ouput, `${this.fileName}.js`, renderContent);
  }
}
