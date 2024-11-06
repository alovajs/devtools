import path from 'node:path';
import * as vscode from 'vscode';
import { CommandKey, commandsMap } from '@/commands';
// 获取workspacePath文件
export const getWorkspacePaths = () => {
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  return workspaceFolders.map(item => `${item.uri.fsPath}/`);
};
// 执行Command
export const executeCommand = <T extends any[]>(cmd: CommandKey, ...args: T) => {
  const commandId = commandsMap[cmd]?.commandId;
  if (commandId) {
    vscode.commands.executeCommand(commandId, ...args);
  }
};
// 获取当前workspacePath
export const getCurrentWorkspacePath = (filePath?: string) => {
  // 获取当前活动编辑器
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return getWorkspacePaths()[0];
  }
  filePath = filePath ?? editor.document.uri.fsPath;
  // 获取当前文件所在的工作区根目录
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
  if (!workspaceFolder) {
    return filePath;
  }
  return `${workspaceFolder.uri.fsPath}/`;
};

export const getCurrentDirectory = () => {
  // 获取当前活动编辑器
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return getWorkspacePaths()[0];
  }
  return path.dirname(editor.document.uri.fsPath);
};
