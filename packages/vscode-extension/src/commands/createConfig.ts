// 用于生成alova.config.js
import generateConfig from '@/functions/generateConfig';
import { getCurrentDirectory } from '@/utils/vscode';

export default {
  commandId: 'alova.create.config',
  handler: () => async () => {
    generateConfig(getCurrentDirectory());
  }
} as Commonand;
