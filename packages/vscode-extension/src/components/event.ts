import { getWormhole } from '@/functions/getWormhole';
import readConfig, { updatedConfigPool } from '@/functions/readConfig';
import { debounce } from '@/utils';
import { getCurrentWorkspacePath, getWorkspacePaths } from '@/utils/vscode';
import * as vscode from 'vscode';
import Error from './error';
import { log } from './message';

export function registerEvent() {
  // listener workspace directory changes
  vscode.workspace.onDidChangeWorkspaceFolders(event => {
    event.added.forEach(workspacePath => {
      readConfig(`${workspacePath.uri.fsPath}/`);
    });
    event.removed.forEach(() => {
      readConfig(getWorkspacePaths());
      updatedConfigPool();
    });
  });
  // listener package.json file changes

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
  // listener alova.config configuration file changes

  vscode.workspace.onDidSaveTextDocument(event => {
    const filePath = event.uri.fsPath;
    if (/alova\.config\.[cm]?[jt]s$/.test(filePath)) {
      readConfig(getCurrentWorkspacePath(filePath));
      updatedConfigPool();
    }
  });
  // Listen for errors

  process.on('uncaughtException', (err: Error) => {
    log(err.message);
    if (err.ERROR_CODE) {
      vscode.window.showErrorMessage(err.message);
    }
  });
  // Listen for unhandled promise rejection

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
