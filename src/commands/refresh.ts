import Error from '@/components/error';
import message from '@/components/message';
import { loading, reset } from '@/components/statusBar';
import { CONFIG_POOL } from '@/helper/configuration';
import { getFileNameByPath } from '@/utils';
import { generate } from '@/wormhole';

export default {
  commandId: 'alova.refresh',
  handler: () => async () => {
    try {
      loading();
      // 生成api文件
      for (const configuration of CONFIG_POOL) {
        await generate(configuration.config, { force: true, projectPath: configuration.workspaceRootDir });
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
