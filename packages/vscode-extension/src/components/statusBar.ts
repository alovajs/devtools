import * as vscode from 'vscode';
// 创建状态栏项
export const loading = (text: string = '') => {
  statusBarItem.text = `$(sync~spin) ${text} Loading...`;
  statusBarItem.tooltip = 'loading';
  statusBarItem.command = undefined;
};
export const enable = () => {
  statusBarItem.text = `$(alova-icon-id) Alova`;
  statusBarItem.tooltip = 'Generate APIs';
  statusBarItem.command = 'alova.refresh';
  statusBarItem.color = undefined;
};
export const disable = () => {
  statusBarItem.text = `$(alova-icon-id) Alova`;
  statusBarItem.tooltip = '@alova/wormhole is not found';
  statusBarItem.color = '#808080'; // 设置颜色为灰色
  statusBarItem.command = undefined;
};
export const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
