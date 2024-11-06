import readConfig, { updatedConfigPool } from '@/functions/readConfig';
import { getWormhole } from '@/functions/getWormhole';
import * as vscode from 'vscode';
import { getWorkspacePaths, getCurrentWorkspacePath } from '@/utils/vscode';
import { debounce } from '@/utils';
import Error from './error';
import { log } from './message';

export function registerEvent() {
  // 监听workspace目录变化
  vscode.workspace.onDidChangeWorkspaceFolders(event => {
    event.added.forEach(workspacePath => {
      readConfig(`${workspacePath.uri.fsPath}/`);
    });
    event.removed.forEach(() => {
      readConfig(getWorkspacePaths());
      updatedConfigPool();
    });
  });
  // 监听package.json文件变化
  vscode.workspace.onDidChangeTextDocument(
    debounce(event => {
      const filePath = event.document.uri.fsPath;
      if (event.contentChanges.length === 0) {
        return;
      }
      if (/package\.json$/.test(filePath) && getWormhole()) {
        readConfig(getCurrentWorkspacePath(filePath));
        updatedConfigPool();
      }
    }, 1000)
  );
  // 监听alova.config配置文件变化
  vscode.workspace.onDidSaveTextDocument(event => {
    const filePath = event.uri.fsPath;
    if (/alova\.config\.[cm]?[jt]s$/.test(filePath)) {
      readConfig(getCurrentWorkspacePath(filePath));
      updatedConfigPool();
    }
  });
  // 监听错误
  process.on('uncaughtException', (err: Error) => {
    log(err.message);
    if (err.ERROR_CODE) {
      vscode.window.showErrorMessage(err.message);
    }
  });
  // 监听未处理的promise rejection
  process.on('unhandledRejection', (error: Error) => {
    const errMsg = error?.message ?? error ?? 'unhandledRejection';
    log(errMsg);
    if (error.ERROR_CODE) {
      vscode.window.showErrorMessage(errMsg);
    }
  });
}
export default {
  registerEvent
};
