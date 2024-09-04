import util from 'node:util';
import * as vscode from 'vscode';
// 创建一个输出通道
export const outputChannel = vscode.window.createOutputChannel('Alova');
export function info(message: string, duration?: number) {
  if (!duration) {
    return vscode.window.showInformationMessage(message);
  }
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: message,
      cancellable: true
    },
    (progress, token) =>
      new Promise(resolve => {
        const timeout = setTimeout(() => {
          resolve(message);
        }, duration); // 自动关闭时间（毫秒）
        token.onCancellationRequested(() => {
          clearTimeout(timeout);
          resolve(message);
        });
      })
  );
}
export function error(message: string) {
  return vscode.window.showErrorMessage(message);
}
export function warning(message: string) {
  return vscode.window.showWarningMessage(message);
}
export function log(...messageArr: any[]) {
  messageArr.forEach(message => {
    if (typeof message === 'object') {
      message = util.inspect(message, { showHidden: true, depth: null, colors: false });
    }
    outputChannel.append(`${message} `);
  });
  outputChannel.append('\n');
}
export default {
  info,
  error,
  warning,
  log,
  outputChannel
};
