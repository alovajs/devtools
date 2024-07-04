import chokidar, { FSWatcher } from 'chokidar';
import { cosmiconfig } from 'cosmiconfig';
import path from 'node:path';
import * as vscode from 'vscode';
import Error from '../components/error';
import message from '../components/message';
import { loadJs, loadTs } from '../helper/lodaders';
import { CONFIG_POOL, Configuration } from '../modules/Configuration';
const WATCH_CONFIG: Map<string, FSWatcher> = new Map();
const alovaExplorer = cosmiconfig('alova', {
  cache: false,
  loaders: {
    '.js': loadJs,
    '.cjs': loadJs,
    '.mjs': loadJs,
    '.ts': loadTs
  }
});
export function createWatcher(workspaceRootPath: string) {
  return chokidar
    .watch(`${workspaceRootPath}/*alova*`, {
      ignored: [/node_modules/]
    })
    .on('change', async () => {
      let configItem: Configuration | undefined;
      try {
        const config = await readConfig(workspaceRootPath, false);
        // 没有配置文件
        if (!config) {
          return;
        }
        configItem = CONFIG_POOL.find(config => config.workspaceRootDir === workspaceRootPath);
        if (!configItem) {
          configItem = new Configuration(config, workspaceRootPath);
          CONFIG_POOL.push(configItem);
        }
        // 替换配置
        configItem.config = config;
        // 检查配置
        configItem.checkConfig();
        // 刷新定时器
        configItem?.refreshAutoUpdate?.();
      } catch (error: any) {
        message.error(error.message);
        configItem?.closeAutoUpdate?.();
      }
    });
}
export async function readConfig(workspaceRootPath: string, createWatch = true) {
  let alovaConfig: AlovaConfig | null = null;
  if (createWatch) {
    // 如果监听器存在则先关闭
    if (!WATCH_CONFIG.has(workspaceRootPath)) {
      const watch = createWatcher(workspaceRootPath);
      // 加入新的监听器
      WATCH_CONFIG.set(workspaceRootPath, watch);
    }
  }
  const searchResult = await alovaExplorer.search(path.resolve(workspaceRootPath));
  if (!searchResult || searchResult?.isEmpty) {
    const idx = CONFIG_POOL.findIndex(config => config.workspaceRootDir === workspaceRootPath);
    if (idx >= 0) {
      // 关闭自动更新
      CONFIG_POOL[idx].closeAutoUpdate();
      // 移除配置
      CONFIG_POOL.splice(idx, 1);
    }
    throw new Error('Expected to create alova.config.js in root directory.');
  }
  console.log(workspaceRootPath, searchResult, 39);

  // 读取文件内容
  alovaConfig = searchResult.config;
  alovaExplorer.clearCaches();
  return alovaConfig;
}
export default async (isAutoUpdate: boolean = true) => {
  if (isAutoUpdate) {
    // 关闭自动更新
    CONFIG_POOL.forEach(config => config.closeAutoUpdate());
    // 清空
    CONFIG_POOL.splice(0, CONFIG_POOL.length);
    // 清空watch
    await Promise.all([...WATCH_CONFIG.values()].map(watch => watch.close()));
    WATCH_CONFIG.clear();
  }
  // 获得所有工作区
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  // 检查所有已存在配置
  CONFIG_POOL.map(config => config.checkConfig());
  // 读取所有已存在配置的缓存文件
  await Promise.all(CONFIG_POOL.map(config => config.readAlovaJson()));
  for (const workspaceFolder of workspaceFolders) {
    const workspaceRootPath = workspaceFolder.uri.fsPath + '/';
    const alovaConfig = await readConfig(workspaceRootPath);
    // 过滤掉没有配置文件
    if (!alovaConfig) {
      continue;
    }
    // 过滤掉存在的
    if (CONFIG_POOL.find(item => item.workspaceRootDir === workspaceRootPath)) {
      continue;
    }
    const configuration = new Configuration(alovaConfig, workspaceRootPath);
    // 检查新配置
    configuration.checkConfig();
    //读取新配置的缓存文件
    await configuration.readAlovaJson();
    if (isAutoUpdate) {
      // 开启自动更新
      configuration.autoUpdate();
    } else {
      configuration.refreshAutoUpdate();
    }
    // 加入配置池子
    CONFIG_POOL.push(configuration);
  }
};
