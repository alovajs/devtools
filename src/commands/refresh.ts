import * as vscode from 'vscode';
import message from '../components/message';
import generateApi from '../functions/generateApi';
import readConfig from '../functions/readConfig';
import { CONFIG_POOL } from '../modules/Configuration';
import { getFileNameByPath } from '../utils';
export default {
  commandId: 'alova.refresh',
  handler: (context: vscode.ExtensionContext) => async () => {
    // 读取配置文件
    await readConfig();
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
            templateTypeArr[idx] ?? 'commonjs',
            true
          );
        })
      );
      message.info(`${getFileNameByPath(configuration.workspaceRootDir)}刷新api文件成功!`, 3000);
    }
  }
};
