import getOpenApiData from '../functions/getOpenApiData';
export class Configuration {
  config: AlovaConfig;
  workspaceRootDir: string;
  constructor(config: AlovaConfig, workspaceRootDir: string) {
    //配置文件
    this.config = config;
    this.workspaceRootDir = workspaceRootDir;
  }
  getTemplateType(generator: GeneratorConfig): TemplateType {
    let type: TemplateType;
    const configType = generator.type;
    //根据配置文件中的type来判断模板类型
    switch (configType) {
      case 'ts':
      case 'typescript':
        type = 'typescript';
        break;
      case 'module':
        type = 'module';
        break;
      case 'auto':
        type = 'typescript';
        break;
      default:
        type = 'commonjs';
        break;
    }
    return type;
  }
  getAllTemplateType() {
    return this.config.generator.map(generator => this.getTemplateType(generator));
  }
  getOutputPath(generator: GeneratorConfig) {
    return generator.output;
  }
  getAllOutputPath() {
    return this.config.generator.map(generator => this.getOutputPath(generator));
  }
  // 获取openapi数据
  getOpenApiData(generator: GeneratorConfig) {
    return getOpenApiData(this.workspaceRootDir, generator.inpput, generator.platform);
  }
  // 获取所有openapi数据
  getAllOpenApiData() {
    return Promise.all(this.config.generator.map(generator => this.getOpenApiData(generator)));
  }
}
