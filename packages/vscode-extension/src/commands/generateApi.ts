import message from '@/components/message';
import { alovaWork } from '@/helper/work';
import { getFileNameByPath } from '@/utils';
// 用于自动生成
export default {
  commandId: 'alova.generateApi',
  handler: () => async (projectPath: string) => {
    await alovaWork.readConfig(false, projectPath);
    // 生成api文件
    const { resultArr } = await alovaWork.generate(false, projectPath);
    for (const [workspaceRootDir, result] of resultArr) {
      if (result) {
        message.info(`[${getFileNameByPath(workspaceRootDir)}]:Your API is updated`);
      }
    }
  }
} as Commonand;
