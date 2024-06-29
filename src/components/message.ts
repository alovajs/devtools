import * as vscode from 'vscode';
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
    (progress, token) => {
      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          resolve(message);
        }, duration); // 自动关闭时间（毫秒）
        token.onCancellationRequested(() => {
          clearTimeout(timeout);
          resolve(message);
        });
      });
    }
  );
}
export function error(message: string) {
  return vscode.window.showErrorMessage(message);
}
export function warning(message: string) {
  return vscode.window.showWarningMessage(message);
}
export default {
  info,
  error,
  warning
};
