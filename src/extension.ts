import fetch from 'node-fetch';
import { createRequire } from 'node:module';
import * as vscode from 'vscode';

let myStatusBarItem: vscode.StatusBarItem;
let apiJson: any;

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
      if (configuration.generator && configuration.generator.length) {
        for (let childObj of configuration.generator) {
          if ('input' in childObj) {
            inputUrl = childObj.input;
          }
        }
      }

      // 临时显示inputUrl地址
      vscode.window.showInformationMessage('input: ' + inputUrl);

      // 发起请求
      fetchData('https://generator3.swagger.io/openapi.json');
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
    apiJson = data;
    console.log(data, 'data');
  } catch (error) {
    console.error('Error:', error);
  }
}
