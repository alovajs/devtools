import * as vscode from 'vscode';
import Error from '../components/error';
import message from '../components/message';
import { loading, reset } from '../components/statusBar';
import generateApi from '../functions/generateApi';
import readConfig from '../functions/readConfig';
import { CONFIG_POOL } from '../modules/Configuration';
import { getFileNameByPath } from '../utils';
export default {
  commandId: 'alova.refresh',
  handler: (context: vscode.ExtensionContext) => async () => {
    try {
      loading();
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
        reset();
        message.info(`[${getFileNameByPath(configuration.workspaceRootDir)}]:Your API is refresh`);
      }
    } catch (error: any) {
      if ((error as Error).ERROR_CODE) {
        message.error(error.message);
      }
    } finally {
      reset();
    }
  }
};
