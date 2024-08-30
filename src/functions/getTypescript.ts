import { createRequire } from 'node:module';
import path from 'node:path';
import * as vscode from 'vscode';

export default async () => {
  // 获得所有工作区
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  let typescript: typeof import('typescript') | null = null;
  for (const workspaceFolder of workspaceFolders) {
    try {
      const workspaceRootPath = `${workspaceFolder.uri.fsPath}/`;
      const workspacedRequire = createRequire(workspaceRootPath);
      typescript = workspacedRequire('./node_modules/typescript');
      delete workspacedRequire.cache[path.resolve(workspaceRootPath, './package.json')];
    } catch (error: any) {
      // log(error.message);
      console.log(error);
    }
  }
  return typescript;
};
