import path from 'node:path';
import importFresh from 'import-fresh';
import { getWorkspacePaths } from '@/utils/vscode';
import Error, { AlovaErrorConstructor } from '@/components/error';
import { enable, disable, BAR_STATE } from '@/components/statusBar';
import { TEMPLATE_DATA } from '@/helper/config';
import { existsSync } from 'node:fs';
import { removeConfiguration } from '@/helper/autoUpdate';
import { globSync } from 'glob';

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
    } catch (error) {}
  }
  if (wormhole && BAR_STATE.value !== 'loading') {
    enable();
  }
  if (wormhole) {
    // 全局配置
    wormhole.setGlobalConfig({
      Error: AlovaErrorConstructor,
      templateData: TEMPLATE_DATA
    });
  }
  if (!wormhole) {
    disable();
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
          removeConfiguration();
          throw new Error('module `@alova/wormhole` is not found, please install it first.', true);
        };
      }
    }
  ) as Wormhole;
