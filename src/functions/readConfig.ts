import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import * as vscode from 'vscode';
import { CONFIG_POOL, Configuration } from '../modules/Configuration';
const WATCH_CONFIG: Array<fs.FSWatcher> = [];
export function readConfig(workspaceRootPath: string, createWatch = true) {
  const workspacedRequire = createRequire(workspaceRootPath);
  let alovaConfig: AlovaConfig | null = null;
  const outputChannel = vscode.window.createOutputChannel('alova');
  try {
    // 读取文件内容
    alovaConfig = workspacedRequire('./alova.config.cjs');
    delete workspacedRequire.cache[path.resolve(workspaceRootPath, './alova.config.cjs')];
    if (!createWatch) {
      return alovaConfig;
    }
    const watch = fs.watch(path.resolve(workspaceRootPath, './alova.config.cjs'), (event, fileName) => {
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
    // vscode.window.showErrorMessage(`${workspaceRootPath}alova.config.cjs文件不存在`);
    outputChannel.appendLine(`${workspaceRootPath}alova.config.cjs文件不存在`);
    outputChannel.show();
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
  for (const workspaceFolder of workspaceFolders) {
    const workspaceRootPath = workspaceFolder.uri.fsPath + '\\';
    const alovaConfig = readConfig(workspaceRootPath);
    if (!alovaConfig) {
      return;
    }
    // 过滤掉存在的
    if (CONFIG_POOL.find(item => item.workspaceRootDir === workspaceRootPath)) {
      continue;
    }
    const configuration = new Configuration(alovaConfig, workspaceRootPath);
    //读取缓存文件
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
