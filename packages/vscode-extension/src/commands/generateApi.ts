import { showError } from '@/components/event';
import message from '@/components/message';
import generate from '@/functions/generate';
import readConfig from '@/functions/readConfig';
import { getFileNameByPath } from '@/utils';

// for automatic generation
export default {
  commandId: 'alova.generateApi',
  handler: () => async (projectPath: string) => {
    try {
      const errorArr: Array<Error> = [];
      const readInfo = await readConfig(projectPath);
      errorArr.push(...readInfo.errorArr);
      // Generate api file
      const generateInfo = await generate({ projectPath });
      for (const [workspaceRootDir, result] of generateInfo.resultArr) {
        if (result) {
          message.info(`[${getFileNameByPath(workspaceRootDir)}]:Your API is updated`);
        }
      }
      errorArr.push(...generateInfo.errorArr);
      errorArr.forEach(error => {
        showError(error);
      });
    } catch (error) {
      showError(error);
    }
  }
} as Commonand;
