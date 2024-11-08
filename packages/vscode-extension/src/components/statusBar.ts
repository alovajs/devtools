import * as vscode from 'vscode';
// Create status bar item
type StatusBarItemType = 'loading' | 'enable' | 'disable';
export const loading = (text: string = '') => {
  BAR_STATE.value = 'loading';
  statusBarItem.text = `$(sync~spin) ${text} Loading...`;
  statusBarItem.tooltip = 'loading';
  statusBarItem.command = undefined;
};
export const enable = () => {
  BAR_STATE.value = 'enable';
  statusBarItem.text = `$(alova-icon-id) Alova`;
  statusBarItem.tooltip = 'Generate APIs';
  statusBarItem.command = 'alova.refresh';
  statusBarItem.color = undefined;
};
export const disable = () => {
  BAR_STATE.value = 'disable';
  statusBarItem.text = `$(alova-icon-id) Alova`;
  statusBarItem.tooltip = 'module `@alova/wormhole` not found';
  statusBarItem.color = '#808080'; // Set color to gray
  statusBarItem.command = undefined;
};
export const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

export const BAR_STATE: { value: StatusBarItemType } = {
  value: 'enable'
};
