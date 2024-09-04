import Error from '@/components/error';
import message from '@/components/message';
import { loadJs, loadTs } from '@/helper/lodaders';
import { CONFIG_POOL, Configuration } from '@/modules/Configuration';
import { getFileNameByPath } from '@/utils';
import { cosmiconfig } from 'cosmiconfig';
import path from 'node:path';
import * as vscode from 'vscode';

const NO_CONFIG_WORKSPACE = new Set<string>();
const alovaExplorer = cosmiconfig('alova', {
  cache: false,
  loaders: {
    '.js': loadJs,
    '.cjs': loadJs,
    '.mjs': loadJs,
    '.ts': loadTs,
    '.mts': loadTs,
    '.cts': loadTs
  }
});
export async function readConfig(workspaceRootPath: string, isShowError = true) {
  let alovaConfig: AlovaConfig | null = null;
  const searchResult = await alovaExplorer.search(path.resolve(workspaceRootPath));
  try {
    if (!searchResult || searchResult?.isEmpty) {
      const idx = CONFIG_POOL.findIndex(config => config.workspaceRootDir === workspaceRootPath);
      if (idx >= 0) {
        // 关闭自动更新
        CONFIG_POOL[idx].closeAutoUpdate();
        // 移除配置
        CONFIG_POOL.splice(idx, 1);
      }
      if (NO_CONFIG_WORKSPACE.has(workspaceRootPath)) {
        return {
          ...searchResult,
          config: alovaConfig
        };
      }
      NO_CONFIG_WORKSPACE.add(workspaceRootPath);
      // 提示用户创建配置文件
      if (isShowError) {
        throw new Error(
          `[${getFileNameByPath(workspaceRootPath)}] Expected to create alova.config.js in root directory.`
        );
      }
    }
    // 读取文件内容
    alovaConfig = searchResult?.config;
    alovaExplorer.clearCaches();
    // 能读到配置文件，则移除没有配置文件的标记
    if (NO_CONFIG_WORKSPACE.has(workspaceRootPath) && alovaConfig) {
      NO_CONFIG_WORKSPACE.delete(workspaceRootPath);
    }
  } catch (error: any) {
    message.error(error.message);
  }
  return {
    ...searchResult,
    config: alovaConfig
  };
}
export default async (isAutoUpdate: boolean = true, isShowError: boolean = true) => {
  if (isAutoUpdate) {
    // 关闭自动更新
    CONFIG_POOL.forEach(config => config.closeAutoUpdate());
    // 清空
    CONFIG_POOL.splice(0, CONFIG_POOL.length);
  }
  // 获得所有工作区
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  // 检查所有已存在配置
  CONFIG_POOL.map(config => config.checkConfig());
  // 读取所有已存在配置的缓存文件
  await Promise.all(CONFIG_POOL.map(config => config.readAlovaJson()));
  const oldSize = NO_CONFIG_WORKSPACE.size;
  for (const workspaceFolder of workspaceFolders) {
    const workspaceRootPath = `${workspaceFolder.uri.fsPath}/`;
    const { config: alovaConfig } = await readConfig(workspaceRootPath, isShowError);
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
    // 加入配置池子
    CONFIG_POOL.push(configuration);
    // 读取新配置的缓存文件
    await configuration.readAlovaJson();
    configuration.refreshAutoUpdate();
  }
  if (
    workspaceFolders.length > 0 &&
    NO_CONFIG_WORKSPACE.size === workspaceFolders.length &&
    oldSize === NO_CONFIG_WORKSPACE.size
  ) {
    throw new Error(`Expected to create alova.config.js in root directory.`);
  }
};
