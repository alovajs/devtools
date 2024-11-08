import message from '@/components/message';
import generate from '@/functions/generate';
import readConfig from '@/functions/readConfig';
import { getFileNameByPath } from '@/utils';

// for automatic generation
export default {
  commandId: 'alova.generateApi',
  handler: () => async (projectPath: string) => {
    await readConfig(projectPath);
    // Generate api file
    const { resultArr } = await generate({ projectPath });
    for (const [workspaceRootDir, result] of resultArr) {
      if (result) {
        message.info(`[${getFileNameByPath(workspaceRootDir)}]:Your API is updated`);
      }
    }
  }
} as Commonand;
