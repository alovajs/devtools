import path from 'node:path';
import importFresh from 'import-fresh';
import { getWorkspacePaths } from '@/utils/vscode';
import message from '@/components/message';

export default () => {
  let wormhole: typeof import('@alova/wormhole') | null = null;
  for (const workspaceRootPath of getWorkspacePaths()) {
    try {
      wormhole = importFresh(path.join(workspaceRootPath, './node_modules/@alova/wormhole'));
    } catch (error) {}
  }
  if (!wormhole) {
    const errorText = '@alova/wormhole is not found, please install it first.';
    message.log(errorText);
    message.error(errorText);
    throw new Error(errorText);
  }
  return wormhole;
};
