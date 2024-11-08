import Error from '@/components/error';
import message from '@/components/message';
import { enable, loading } from '@/components/statusBar';
import generate from '@/functions/generate';
import readConfig, { updatedConfigPool } from '@/functions/readConfig';
import { getFileNameByPath } from '@/utils';
import { getWorkspacePaths } from '@/utils/vscode';

export default {
  commandId: 'alova.refresh',
  handler: () => async () => {
    try {
      loading();
      if (!(await readConfig(getWorkspacePaths()))) {
        throw new Error('Expected to create alova.config.js in root directory.');
      }
      updatedConfigPool();
      // Generate api file
      const { resultArr, errorArr } = await generate({ force: true });
      for (const [workspaceRootDir] of resultArr) {
        message.info(`[${getFileNameByPath(workspaceRootDir)}]: Your API is updated`);
      }
      errorArr.forEach(([, error]) => {
        throw error;
      });
    } finally {
      enable();
    }
  }
} as Commonand;
