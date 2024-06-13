import path from 'path';
import { generateFile, readAndRenderTemplate } from '../utils';
import { srcPath } from '../utils/path';
export class TemplateFile {
  fileName: string;
  projectType: ConfigType;
  constructor(fileName: string, projectType: ConfigType) {
    // 根据projectType确定使用哪个模板文件夹下的模板
    this.projectType = projectType;
    // 根据fileName确定当前类对应哪个文件，后缀由projectType确定
    this.fileName = fileName;
  }
  getExtByProjectType() {
    switch (this.projectType) {
      case 'ts':
      case 'typescript':
        return '.ts';
      default:
        return '.js';
    }
  }
  async outputFile(data: Record<string, any>, ouput: string, ext?: string) {
    // 这里实现模板文件渲染工作，例如返回文件内容和文件名，然后再写入output的文件夹
    const templatePath = path.resolve(srcPath, `templates/${this.projectType}/${this.fileName}.mustache`);
    const renderContent = await readAndRenderTemplate(templatePath, data);
    generateFile(ouput, `${this.fileName}${ext ?? this.getExtByProjectType()}`, renderContent);
  }
}
