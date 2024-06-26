import * as vscode from 'vscode';
import generateApi from '../functions/generateApi';
import readConfig from '../functions/readConfig';
import { CONFIG_POOL } from '../modules/Configuration';
import { getFileNameByPath } from '../utils';
// 用于自动生成
export default {
  commandId: 'alova.generateApi',
  handler: (context: vscode.ExtensionContext) => async () => {
    // 获取当前工作区
    try {
      await readConfig(false);
      // 生成api文件
      for (const configuration of CONFIG_POOL) {
        // 过滤掉不需要更新的配置
        if (!configuration.shouldUpdate) {
          continue;
        }
        configuration.shouldUpdate = false;
        const fileName = getFileNameByPath(configuration.workspaceRootDir);
        const outputPathArr = configuration.getAllOutputPath();
        const templateTypeArr = configuration.getAllTemplateType();
        const openApiData = await configuration.getAllOpenApiData();
        const generatorConfigArr = configuration.config.generator;
        const result = await Promise.all(
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
        if (result.some(item => !!item)) {
          vscode.window.showInformationMessage(`${fileName}生成api文件成功!`);
        }
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message);
    }
  }
};
