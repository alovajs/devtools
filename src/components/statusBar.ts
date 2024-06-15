import * as vscode from 'vscode';
// 创建状态栏项

export const loading = () => {
  statusBarItem.text = '$(sync~spin) Loading...';
  statusBarItem.command = '';
};
export const reset = () => {
  statusBarItem.text = `$(alova-icon-id) alova`;
  statusBarItem.tooltip = 'alova refresh';
  statusBarItem.command = 'alova.refresh';
};
export const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
