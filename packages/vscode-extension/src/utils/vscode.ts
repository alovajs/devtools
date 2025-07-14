import path from 'node:path';
import * as vscode from 'vscode';
// Get workspace path file
export const getWorkspacePaths = () => {
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  return workspaceFolders.map(item => `${item.uri.fsPath}/`);
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

export const registerCommand = <U = [], T = void>(command: CommandType<U, T>, ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(command.commandId, command.handler(ctx));
