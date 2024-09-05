import Error from '@/components/error';
import message from '@/components/message';
import { loading, reset } from '@/components/statusBar';
import { alovaWork } from '@/helper/work';
import { getFileNameByPath } from '@/utils';

export default {
  commandId: 'alova.refresh',
  handler: () => async () => {
    try {
      await alovaWork.readConfig(true);
      loading();
      // 生成api文件
      const { resultArr, errorArr } = await alovaWork.generate(true);
      for (const [workspaceRootDir] of resultArr) {
        message.info(`[${getFileNameByPath(workspaceRootDir)}]:Your API is refresh`);
      }
      errorArr.forEach(([, error]) => {
        throw error;
      });
    } catch (error: any) {
      if ((error as Error)?.ERROR_CODE) {
        message.error(error.message);
      }
    } finally {
      reset();
    }
  }
} as Commonand;
