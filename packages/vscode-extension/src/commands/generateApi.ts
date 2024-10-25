import message from '@/components/message';
import readConfig from '@/functions/readConfig';
import generate from '@/functions/generate';
import { getFileNameByPath } from '@/utils';
// 用于自动生成
export default {
  commandId: 'alova.generateApi',
  handler: () => async (projectPath: string) => {
    await readConfig(projectPath);
    // 生成api文件
    const { resultArr } = await generate({ projectPath });
    for (const [workspaceRootDir, result] of resultArr) {
      if (result) {
        message.info(`[${getFileNameByPath(workspaceRootDir)}]:Your API is updated`);
      }
    }
  }
} as Commonand;
