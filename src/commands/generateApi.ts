import { createRequire } from 'node:module';
import * as vscode from 'vscode';
import generateApi from '../functions/generateApi';
import { Configuration } from '../modules/Configuration';
export default {
  commandId: 'alova.start',
  handler: async () => {
    // 获取当前工作区
    const workspaceFolders = vscode.workspace.workspaceFolders;
    workspaceFolders?.forEach(async workspaceFolder => {
      const workspaceRootPath = workspaceFolder.uri.fsPath + '/';
      const workspacedRequire = createRequire(workspaceRootPath);
      let alovaConfig: AlovaConfig | null = null;
      const outputChannel = vscode.window.createOutputChannel('alova');
      try {
        // 读取文件内容
        alovaConfig = workspacedRequire('./alova.config.cjs');
      } catch (error) {
        // 如果文件不存在，则提示用户
        // vscode.window.showErrorMessage(`${workspaceRootPath}alova.config.cjs文件不存在`);
        outputChannel.appendLine(`${workspaceRootPath}alova.config.cjs文件不存在`);
        outputChannel.show();
        return;
      }
      if (!alovaConfig) {
        return;
      }
      const configuration = new Configuration(alovaConfig, workspaceRootPath);
      const outputPathArr = configuration.getAllOutputPath();
      const templateTypeArr = configuration.getAllTemplateType();
      const openApiData = await configuration.getAllOpenApiData();
      outputPathArr.forEach(async (outputPath, idx) => {
        // 生成api文件
        generateApi(workspaceRootPath, outputPath, openApiData[idx], templateTypeArr[idx]);
      });
    });
  }
};
