import { createRequire } from 'node:module';
import { PackageJson } from 'type-fest';
import * as vscode from 'vscode';
import { frameworkName } from '../globalConfig';
export default function () {
  const workspaceRootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/';
  const workspacedRequire = createRequire(workspaceRootPath);
  const packageJson: PackageJson = workspacedRequire('./package.json');
  if (!packageJson) {
    return 'defaultKey';
  }
  // 框架技术栈标签  vue | react
  const frameTag = frameworkName.find(framework => packageJson.dependencies?.[framework]) ?? 'defaultKey';
  return frameTag;
}
