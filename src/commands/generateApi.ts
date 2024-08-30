import message from '@/components/message';
import { CONFIG_POOL } from '@/helper/configuration';
import { getFileNameByPath } from '@/utils';
import { generate } from '@/wormhole';
// 用于自动生成
export default {
  commandId: 'alova.generateApi',
  handler: () => async () => {
    // 生成api文件
    for (const configuration of CONFIG_POOL) {
      const result = await generate(configuration.config, { projectPath: configuration.workspaceRootDir });
      if (result?.some(item => !!item)) {
        message.info(`[${getFileNameByPath(configuration.workspaceRootDir)}]:Your API is updated`);
      }
    }
  }
} as Commonand;
