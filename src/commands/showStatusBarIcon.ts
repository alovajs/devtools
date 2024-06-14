import * as vscode from 'vscode';
// 创建状态栏项
export default {
  commandId: 'alova.showStatusBarIcon',
  handler: (context: vscode.ExtensionContext) => async () => {
    // 创建状态栏项
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = `$(refresh)alova`;
    statusBarItem.tooltip = 'alova refresh';
    statusBarItem.command = 'alova.refresh';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
  }
};
