import { CommandKey, commandsMap } from '@/commands';
import path from 'node:path';
import * as vscode from 'vscode';
// Get workspace path file
export const getWorkspacePaths = () => {
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  return workspaceFolders.map(item => `${item.uri.fsPath}/`);
};
// Execute command
export const executeCommand = <T extends any[]>(cmd: CommandKey, ...args: T) => {
  const commandId = commandsMap[cmd]?.commandId;
  if (commandId) {
    vscode.commands.executeCommand(commandId, ...args);
  }
};
// Get the current workspace path
export const getCurrentWorkspacePath = (filePath?: string) => {
  // Get the currently active editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return getWorkspacePaths()[0];
  }
  filePath = filePath ?? editor.document.uri.fsPath;
  // Get the workspace root directory where the current file is located
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
  if (!workspaceFolder) {
    return filePath;
  }
  return `${workspaceFolder.uri.fsPath}/`;
};

export const getCurrentDirectory = () => {
  // Get the currently active editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return getWorkspacePaths()[0];
  }
  return path.dirname(editor.document.uri.fsPath);
};
