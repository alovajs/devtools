import Error, { AlovaErrorConstructor } from '@/components/error';
import { BAR_STATE, disable, enable } from '@/components/statusBar';
import { removeConfiguration } from '@/helper/autoUpdate';
import { TEMPLATE_DATA } from '@/helper/config';
import { getWorkspacePaths } from '@/utils/vscode';
import { globSync } from 'glob';
import importFresh from 'import-fresh';
import { existsSync } from 'node:fs';
import path from 'node:path';

type Wormhole = typeof import('@alova/wormhole');
export const getWormhole = () => {
  let wormhole: Wormhole | null = null;
  for (const workspaceRootPath of getWorkspacePaths()) {
    if (wormhole) {
      break;
    }
    try {
      const configPaths = globSync('**/alova.config.{js,cjs,mjs,ts,mts,cts}', {
        ignore: 'node_modules/**',
        cwd: workspaceRootPath,
        absolute: true
      }).concat(path.join(workspaceRootPath, './alova.config.js'));
      for (const configPath of configPaths) {
        const wormholePath = path.join(path.dirname(configPath), './node_modules/@alova/wormhole');
        if (existsSync(wormholePath)) {
          wormhole = importFresh(wormholePath);
          break;
        }
      }
    } catch {}
  }
  if (wormhole && BAR_STATE.value !== 'loading') {
    enable();
  }
  if (!wormhole) {
    disable();
    removeConfiguration();
  }
  if (wormhole) {
    // Global configuration

    wormhole.setGlobalConfig({
      Error: AlovaErrorConstructor,
      templateData: TEMPLATE_DATA
    });
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
          return wormhole[key];
        }
        return () => {
          throw new Error('module `@alova/wormhole` is not found, please install it first.', true);
        };
      }
    }
  ) as Wormhole;
