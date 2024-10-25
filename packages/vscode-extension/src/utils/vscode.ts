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
