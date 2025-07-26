import path from 'node:path'
import * as vscode from 'vscode'
// Get workspace path file
export function getWorkspacePaths() {
  const workspaceFolders = vscode.workspace.workspaceFolders || []
  return workspaceFolders.map(item => `${item.uri.fsPath}/`)
}
// Get the current workspace path
export function getCurrentWorkspacePath(filePath?: string) {
  // Get the currently active editor
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return getWorkspacePaths()[0]
  }
  filePath = filePath ?? editor.document.uri.fsPath
  // Get the workspace root directory where the current file is located
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath))
  if (!workspaceFolder) {
    return filePath
  }
  return `${workspaceFolder.uri.fsPath}/`
}

export function getCurrentDirectory() {
  // Get the currently active editor
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return getWorkspacePaths()[0]
  }
  return path.dirname(editor.document.uri.fsPath)
}

export function registerCommand<U = [], T = void>(command: CommandType<U, T>, ctx: vscode.ExtensionContext) {
  return vscode.commands.registerCommand(command.commandId, command.handler(ctx))
}
export async function focusView(viewId: string) {
  // 聚焦到目标视图
  await vscode.commands.executeCommand(`${viewId}.focus`)
}

export async function expandView(viewId: string) {
  await vscode.commands.executeCommand(`workbench.view.extension.${viewId}`)
}
