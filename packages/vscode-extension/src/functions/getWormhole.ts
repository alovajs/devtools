import path from 'node:path';
import importFresh from 'import-fresh';
import { getWorkspacePaths } from '@/utils/vscode';
import Error from '@/components/error';
import { enable, disable } from '@/components/statusBar';

type Wormhole = typeof import('@alova/wormhole');
const NO_ERROR_KEYS: Array<keyof Wormhole> = ['setGlobalConfig'];

export const getWormhole = () => {
  let wormhole: Wormhole | null = null;
  for (const workspaceRootPath of getWorkspacePaths()) {
    try {
      wormhole = importFresh(path.join(workspaceRootPath, './node_modules/@alova/wormhole'));
      break;
    } catch (error) {}
  }
  return wormhole;
};

export default () =>
  new Proxy(
    {},
    {
      get(_, key: keyof Wormhole) {
        const wormhole = getWormhole();
        if (wormhole) {
          enable();
          return wormhole[key];
        }
        disable();
        return () => {
          if (!NO_ERROR_KEYS.includes(key)) {
            throw new Error('@alova/wormhole is not found, please install it first.', true);
          }
        };
      }
    }
  ) as Wormhole;
