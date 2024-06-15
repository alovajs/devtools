import * as vscode from 'vscode';
import * as statusBar from '../components/statusBar';
// 显示状态栏项
export default {
  commandId: 'alova.showStatusBarIcon',
  handler: (context: vscode.ExtensionContext) => async () => {
    statusBar.reset();
    statusBar.statusBarItem.show();
    context.subscriptions.push(statusBar.statusBarItem);
  }
};
