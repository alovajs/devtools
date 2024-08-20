import Error from '@/components/error';
import message from '@/components/message';
import { loading, reset } from '@/components/statusBar';
import readConfig from '@/functions/readConfig';
import { CONFIG_POOL } from '@/modules/Configuration';
import { getFileNameByPath } from '@/utils';
import { generate } from '@/wormhole';

export default {
  commandId: 'alova.refresh',
  handler: () => async () => {
    try {
      loading();
      // 读取配置文件
      await readConfig();

      // 生成api文件
      for (const configuration of CONFIG_POOL) {
        await generate(configuration.workspaceRootDir, configuration.config, { force: true });
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
} as Commonand;
