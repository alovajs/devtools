import Error from '@/components/error';
import { showError } from '@/components/event';
import message from '@/components/message';
import { enable, loading } from '@/components/statusBar';
import generate from '@/functions/generate';
import { getWormhole } from '@/functions/getWormhole';
import readConfig, { updatedConfigPool } from '@/functions/readConfig';
import { getFileNameByPath } from '@/utils';
import { getWorkspacePaths } from '@/utils/vscode';

export default {
  commandId: 'alova.refresh',
  handler: () => async () => {
    try {
      loading();
      const errorArr: Array<Error> = [];
      const readInfo = await readConfig(getWorkspacePaths());
      if (readInfo.errorArr.length > 0) {
        errorArr.push(...readInfo.errorArr);
      }
      if (readInfo.configNum === 0 && readInfo.errorArr.length === 0) {
        throw new Error('Expected to create alova.config.js in root directory.');
      }
      updatedConfigPool();
      // Generate api file
      const generateInfo = await generate({ force: true });
      for (const [workspaceRootDir] of generateInfo.resultArr) {
        message.info(`[${getFileNameByPath(workspaceRootDir)}]: Your API is updated`);
      }
      errorArr.push(...generateInfo.errorArr);
      errorArr.forEach(error => {
        showError(error);
      });
    } catch (error) {
      showError(error);
    } finally {
      if (getWormhole()) {
        enable();
      }
    }
  }
} as Commonand;
