// 用于自动生成alova.config.js
import generateConfig from '@/functions/generateConfig';
import { getCurrentWorkspacePath } from '@/utils/vscode';

export default {
  commandId: 'alova.create.config',
  handler: () => async () => {
    generateConfig(getCurrentWorkspacePath());
  }
} as Commonand;
