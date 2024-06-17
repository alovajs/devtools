import * as vscode from 'vscode';
import * as statusBar from '../components/statusBar';
import generateApi from '../functions/generateApi';
import readConfig from '../functions/readConfig';
import { CONFIG_POOL } from '../modules/Configuration';
export default {
  commandId: 'alova.refresh',
  handler: (context: vscode.ExtensionContext) => async () => {
    // 加载
    statusBar.loading();
    // 获取当前工作区
    try {
      // 读取配置文件
      readConfig();
      // 生成api文件
      for (const configuration of CONFIG_POOL) {
        const outputPathArr = configuration.getAllOutputPath();
        const templateTypeArr = configuration.getAllTemplateType();
        const openApiData = await configuration.getAllOpenApiData();
        const generatorConfigArr = configuration.config.generator;
        await Promise.all(
          outputPathArr.map((outputPath, idx) => {
            // 生成api文件
            return generateApi(
              configuration.workspaceRootDir,
              outputPath,
              openApiData[idx],
              generatorConfigArr[idx],
              templateTypeArr[idx] ?? 'commonjs'
            );
          })
        );
        vscode.window.showInformationMessage('生成api文件成功!');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message);
    }
    // 完成加载
    statusBar.reset();
  }
};
