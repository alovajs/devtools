import message from '@/components/message';
import readConfig from '@/functions/readConfig';
import { CONFIG_POOL } from '@/modules/Configuration';
import { getFileNameByPath } from '@/utils';
import { generate } from '@/wormhole';
// 用于自动生成
export default {
  commandId: 'alova.generateApi',
  handler: () => async () => {
    // 读取配置文件
    await readConfig(false);
    // 生成api文件
    for (const configuration of CONFIG_POOL) {
      // 过滤掉不需要更新的配置
      if (!configuration.shouldUpdate) {
        continue;
      }
      configuration.shouldUpdate = false;
      const result = await generate(configuration.workspaceRootDir, configuration.config);
      if (result?.some(item => !!item)) {
        message.info(`[${getFileNameByPath(configuration.workspaceRootDir)}]:Your API is updated`);
      }
    }
  }
} as Commonand;
