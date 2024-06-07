import { createRequire } from 'node:module';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';
import * as vscode from 'vscode';
import { frameworkName, jsonUrl } from '../globalConfig';
import { TemplateFile } from '../modules/TemplateFile';
import { fetchData, readAndRenderTemplate } from '../utils/index';

export default {
  commandId: 'alova.start',
  handler: async () => {
    // 获取到当前工作区的alova配置文件路径
    const workspaceRootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/';
    const workspacedRequire = createRequire(workspaceRootPath);

    // 读取文件内容
    const configuration = workspacedRequire('./alova.config.cjs');
    console.log('🚀 ~ returnvscode.commands.registerCommand ~ configuration:', configuration);

    // 查找对应的input属性值
    type configType = 'auto' | 'ts' | 'typescript' | 'module' | 'commonjs';
    let inputUrl = '',
      outputPath = '',
      type: configType = 'auto';
    // platform = '';
    if (configuration.generator && configuration.generator.length) {
      inputUrl = configuration.generator.find((item: { input: string }) => 'input' in item)?.name || '';
      // platform = configuration.generator.find((item: {platform: string}) => 'platform' in item)?.platform || null
      outputPath = configuration.generator.find((item: { output: string }) => 'output' in item)?.output || null;
      type = configuration.generator.find((item: { type: configType }) => 'type' in item)?.type || null;

      // 临时显示inputUrl地址
      vscode.window.showInformationMessage('input: ' + inputUrl);

      // 发起请求
      const data: OpenAPIV3.Document = await fetchData(jsonUrl);
      if (!data) return;
      console.log('🚀 ~ vscode.commands.registerCommand ~ data:', data);

      const packageJson = workspacedRequire('./package.json');
      // 框架技术栈标签  vue | react
      const frameTag = frameworkName.find(framework => packageJson.dependencies[framework]) ?? 'defaultKey';

      if (!data.paths) return;
      const paths = data.paths;
      interface PathInfo {
        key: string;
        method: string;
        path: string;
      }
      const pathInfoArr: PathInfo[] = [];
      for (const [path, pathInfo] of Object.entries(paths)) {
        for (const [method, methodInfo] of Object.entries(pathInfo as Object)) {
          const methodFormat = method.toUpperCase();
          pathInfoArr.push({
            key: `${methodInfo.tags[0]}.${methodInfo.operationId}`,
            method: methodFormat,
            path
          });
        }
      }

      // 准备interface需要的数据
      // 将接口数据对象转为数组结构
      if (!data.components || !data.components.schemas) return;
      const schemas = data.components.schemas;
      interface propertiesInfoItem {
        key: string;
        type: string;
        example: string;
        enum: string | undefined;
        deprecated: boolean;
        description: string;
      }
      interface schemasInfoItem {
        title: string;
        description: string;
        name: string;
        propertiesInfo: propertiesInfoItem[];
      }
      const schemasInfoArr: schemasInfoItem[] = [];
      for (const [schema, schemaInfo] of Object.entries(schemas)) {
        const propertiesInfo = [];
        for (const [key, value] of Object.entries((schemaInfo as any).properties)) {
          console.log('🚀 ~ vscode.commands.registerCommand ~ value:', key, value);
          propertiesInfo.push({
            key,
            type: (value as any).type,
            example: (value as any).example,
            enum: (value as any).enum ? (value as any).enum.join('" | "') : undefined,
            deprecated: (value as any).deprecated,
            description: (value as any).description
          });
        }
        schemasInfoArr.push({
          title: (schemaInfo as any).title,
          description: (schemaInfo as any).description,
          name: schema,
          propertiesInfo
        });
      }

      // 头部注释部分
      const commentText = await readAndRenderTemplate(
        path.resolve(__dirname, `../../src/templates/${type}/comment.mustache`),
        {
          ...data
        }
      );

      // 目标文件夹路径
      const distDir = path.join(workspaceRootPath, outputPath);

      // mustache语法生成
      // 定义模版配置对象
      const templateFiles = [
        {
          fileName: 'index',
          injections: () => ({ ...data, [frameTag]: true })
        },
        {
          fileName: 'createApis',
          injections: () => data
        },
        {
          fileName: 'apiDefinitions',
          injections: () => ({ ...data, paths: pathInfoArr, commentText })
        }
        // {
        //   fileName: 'globals.d',
        //   injections: () => ({
        //     ...data,
        //     schemasInfo: schemasInfoArr,
        //     commentText
        //   })
        // }
      ];

      templateFiles.forEach(async ({ fileName, injections }) => {
        const templateFile = new TemplateFile(fileName, type);
        templateFile.outputFile(injections(), distDir);
      });
    }
  }
};
