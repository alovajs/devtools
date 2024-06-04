import { createRequire } from 'node:module';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';
import * as vscode from 'vscode';
import { frameworkName } from '../config/index';
import { fetchData, generateFile, readAndRenderTemplate } from '../utils/index';

export function generateApiCommand(): vscode.Disposable {
  const myCommandId = 'alova.start';
  return vscode.commands.registerCommand(myCommandId, async () => {
    vscode.window.showInformationMessage('hehehe1');

    // 获取到当前工作区的alova配置文件路径
    const workspacedRequire = createRequire(vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/');

    // 读取文件内容
    const configuration = workspacedRequire('./alova.config.cjs');

    // 查找对应的input属性值
    let inputUrl = '';
    // platform = '';
    if (configuration.generator && configuration.generator.length) {
      for (let childObj of configuration.generator) {
        // 接口文档api url
        if ('input' in childObj) {
          inputUrl = childObj.input;
        }
        // 接口文档平台名称，首字母大写
        // else if ('platform' in childObj) {
        //   const temp = childObj.platform;
        //   platform = temp.slice(0, 1).toUpperCase() + temp.slice(1);
        // }
      }
    }

    // 临时显示inputUrl地址
    vscode.window.showInformationMessage('input: ' + inputUrl);

    // 发起请求
    const data: OpenAPIV3.Document = await fetchData('https://generator3.swagger.io/openapi.json');
    if (!data) return;
    console.log('🚀 ~ vscode.commands.registerCommand ~ data:', data);

    const packageJson = workspacedRequire('./package.json');
    // 框架技术栈标签  vue | react
    const frameTag = frameworkName.find(framework => packageJson.dependencies[framework]) || 'vue';

    // 目标文件夹路径
    const distDir = path.join(__dirname, '../../design');

    // mustache语法生成

    // 渲染头部注释部分
    const commentText = await readAndRenderTemplate(path.resolve(__dirname, '../../src/templates/comment.mustache'), {
      ...data
    });

    // 渲染生成index.js
    const renderdIndex = await readAndRenderTemplate(path.resolve(__dirname, '../../src/templates/index.mustache'), {
      ...data,
      [frameTag]: true
    });

    generateFile(distDir, 'index.js', renderdIndex);

    // 渲染生成apiDefinitions.js
    // 将接口数据对象转为数组结构
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
    const renderApiDefinitions = await readAndRenderTemplate(
      path.resolve(__dirname, '../../src/templates/apiDefinitions.mustache'),
      { ...data, paths: pathInfoArr, commentText }
    );
    generateFile(distDir, 'apiDefinitions.js', renderApiDefinitions);

    // 渲染生成createApis.js
    const renderCreateApis = await readAndRenderTemplate(
      path.resolve(__dirname, '../../src/templates/createApis.mustache'),
      {
        commentText,
        ...data
      }
    );

    generateFile(distDir, 'createApis.js', renderCreateApis);

    // 渲染生成globals.d.ts
    // 准备interface需要的数据
    // 将接口数据对象转为数组结构
    if (!data.components || !data.components.schemas) return;
    const schemas = data.components.schemas;
    const schemasInfoArr = [];
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
    const renderGlobals = await readAndRenderTemplate(
      path.resolve(__dirname, '../../src/templates/globals.d.mustache'),
      {
        ...data,
        schemasInfo: schemasInfoArr,
        commentText
      }
    );
    console.log('🚀 ~ vscode.commands.registerCommand ~ renderGlobals:', renderGlobals);
    console.log(schemasInfoArr, 'schemasInfoArr');
    // generateFile(distDir, 'globals.d.ts', renderGlobals);
  });
}
