import { createRequire } from 'node:module';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';
import * as vscode from 'vscode';
import generateApi from '../functions/generateApi';
import { jsonUrl } from '../globalConfig';
import { fetchData } from '../utils/index';
export default {
  commandId: 'alova.start',
  handler: async () => {
    // 获取到当前工作区的alova配置文件路径
    const workspaceRootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/';
    const workspacedRequire = createRequire(workspaceRootPath);

    // 读取文件内容
    const configuration: AlovaConfig = workspacedRequire('./alova.config.cjs');
    console.log('🚀 ~ returnvscode.commands.registerCommand ~ configuration:', configuration);

    let inputUrl = '',
      outputPath = '',
      type: TemplateType = 'module';
    // platform = '';
    if (configuration.generator && configuration.generator.length) {
      inputUrl = configuration.generator.find(item => item.inpput)?.inpput || '';
      // platform = configuration.generator.find((item: {platform: string}) => 'platform' in item)?.platform || null
      outputPath = configuration.generator.find(item => item.output)?.output || '';
      // type = configuration.generator.find(item => item.type)?.type || 'commonjs';
      const configType = configuration.generator.find(item => item.type)?.type || 'commonjs';
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
      // 发起请求
      const data: OpenAPIV3.Document = await fetchData(jsonUrl);
      if (!data) {
        return;
      }

      // 目标文件夹路径
      const distDir = path.join(workspaceRootPath, outputPath);
      // 生成api文件
      generateApi(distDir, data, type);
    }
  }
};
