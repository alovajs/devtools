import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import * as vscode from 'vscode';
import { CONFIG_POOL, Configuration } from '../modules/Configuration';
const WATCH_CONFIG: Array<fs.FSWatcher> = [];
const SUPPORT_EXT = ['.js', '.cjs'];
export function readConfigPath(workspaceRootPath: string) {
  const ext = SUPPORT_EXT.find(ext => fs.existsSync(path.resolve(workspaceRootPath, `./alova.config${ext}`))) ?? '';
  if (!ext) {
    return '';
  }
  return `alova.config${ext}`;
}
export function readConfig(workspaceRootPath: string, createWatch = true) {
  const workspacedRequire = createRequire(workspaceRootPath);
  let alovaConfig: AlovaConfig | null = null;
  const configPath = readConfigPath(workspaceRootPath);
  if (!configPath) {
    vscode.window.showErrorMessage('Expected to create alova.config.js in root directory.');
    return alovaConfig;
  }
  try {
    // 读取文件内容
    alovaConfig = workspacedRequire(`./${configPath}`);
    delete workspacedRequire.cache[path.resolve(workspaceRootPath, `./${configPath}`)];
    if (!createWatch) {
      return alovaConfig;
    }
    const watch = fs.watch(path.resolve(workspaceRootPath, `./${configPath}`), (event, fileName) => {
      const config = readConfig(workspaceRootPath, false);
      // 替换配置
      const configItem = CONFIG_POOL.find(config => config.workspaceRootDir === workspaceRootPath);
      if (configItem && config) {
        configItem.config = config;
        // 刷新定时器
        configItem?.refreshAutoUpdate?.();
      }
    });
    WATCH_CONFIG.push(watch);
  } catch (error) {
    // 如果文件不存在，则提示用户
    vscode.window.showErrorMessage(`${workspaceRootPath}${configPath} read error`);
  }
  return alovaConfig;
}
export default async (isAutoUpdate: boolean = true) => {
  if (isAutoUpdate) {
    // 关闭自动更新
    CONFIG_POOL.forEach(config => config.closeAutoUpdate());
    // 清空
    CONFIG_POOL.splice(0, CONFIG_POOL.length);
    // 清空watch
    WATCH_CONFIG.splice(0, WATCH_CONFIG.length);
  }
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  // 检查所有已存在配置
  await Promise.all(CONFIG_POOL.map(config => config.checkConfig()));
  // 读取所有已存在配置的缓存文件
  await Promise.all(CONFIG_POOL.map(config => config.readAlovaJson()));
  for (const workspaceFolder of workspaceFolders) {
    const workspaceRootPath = workspaceFolder.uri.fsPath + '/';
    const alovaConfig = readConfig(workspaceRootPath);
    // 过滤掉没有配置文件
    if (!alovaConfig) {
      continue;
    }
    // 过滤掉存在的
    if (CONFIG_POOL.find(item => item.workspaceRootDir === workspaceRootPath)) {
      continue;
    }
    const configuration = new Configuration(alovaConfig, workspaceRootPath);
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
