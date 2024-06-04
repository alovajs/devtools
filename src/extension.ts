import fetch from 'node-fetch';
import { createRequire } from 'node:module';
import path from 'path';
import * as vscode from 'vscode';
import { frameworkName } from './config/index';
import { generateFile, readAndRenderTemplate } from './utils/index';

let myStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const myCommandId = 'alova.start';
  context.subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
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
      const data = await fetchData('https://generator3.swagger.io/openapi.json');
      console.log('🚀 ~ vscode.commands.registerCommand ~ data:', data);

      const packageJson = workspacedRequire('./package.json');
      // 框架技术栈标签  vue | react
      const frameTag = frameworkName.find(framework => packageJson.dependencies[framework]) || 'vue';
      console.log('🚀 ~ vscode.commands.registerCommand ~ frameTag:', frameTag);

      // 目标文件夹路径
      const distDir = path.join(__dirname, '../design');

      // mustache语法生成

      // 渲染头部注释部分
      const commentText = await readAndRenderTemplate(path.resolve(__dirname, '../src/templates/comment.mustache'), {
        ...data
      });

      // 渲染生成index.js
      const renderdIndex = await readAndRenderTemplate(path.resolve(__dirname, '../src/templates/index.mustache'), {
        ...data,
        [frameTag]: true
      });

      generateFile(distDir, 'index.js', renderdIndex);

      // 渲染生成apiDefinitions.js
      // 将接口数据对象转为数组结构
      const paths = data.paths;
      const pathInfoArr = [];
      for (const [path, pathInfo] of Object.entries(paths)) {
        for (const [method, methodInfo] of Object.entries(pathInfo as Object)) {
          console.log('🚀 ~ vscode.commands.registerCommand ~ methodInfo:', method);
          const methodFormat = method.toUpperCase();
          pathInfoArr.push({
            key: `${methodInfo.tags[0]}.${methodInfo.operationId}`,
            method: methodFormat,
            path
          });
        }
      }
      const renderApiDefinitions = await readAndRenderTemplate(
        path.resolve(__dirname, '../src/templates/apiDefinitions.mustache'),
        { ...data, paths: pathInfoArr, commentText }
      );
      generateFile(distDir, 'apiDefinitions.js', renderApiDefinitions);

      // 渲染生成createApis.js
      const renderCreateApis = await readAndRenderTemplate(
        path.resolve(__dirname, '../src/templates/createApis.mustache'),
        {
          commentText,
          ...data
        }
      );

      generateFile(distDir, 'createApis.js', renderCreateApis);

      // 渲染生成globals.d.ts
      // 准备interface需要的数据
      // 将接口数据对象转为数组结构
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
        path.resolve(__dirname, '../src/templates/globals.d.mustache'),
        {
          ...data,
          schemasInfo: schemasInfoArr,
          commentText
        }
      );
      console.log('🚀 ~ vscode.commands.registerCommand ~ renderGlobals:', renderGlobals);
      console.log(schemasInfoArr, 'schemasInfoArr');
      // generateFile(distDir, 'globals.d.ts', renderGlobals);
    })
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  myStatusBarItem.command = myCommandId;
  context.subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
  context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

  // update status bar item once at start
  updateStatusBarItem();
}

function updateStatusBarItem(): void {
  myStatusBarItem.text = `$(alova-icon-id) can be refresh`;
  myStatusBarItem.show();
}

async function fetchData(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
