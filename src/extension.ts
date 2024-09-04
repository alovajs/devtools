import { commands } from '@/commands';
import setup from '@/commands/setup';
import * as vscode from 'vscode';
import Error from './components/error';
import { log } from './components/message';

export function activate(context: vscode.ExtensionContext) {
  // 插件注册
  commands.forEach(({ commandId, handler }) => {
    context.subscriptions.push(vscode.commands.registerCommand(commandId, handler(context)));
  });
  vscode.commands.executeCommand(setup.commandId);
}
process.on('uncaughtException', (err: Error) => {
  log(err.message);
  if (err.ERROR_CODE) {
    vscode.window.showErrorMessage(err.message);
  }
});
process.on('unhandledRejection', (error: Error) => {
  const errMsg = error?.message ?? error ?? 'unhandledRejection';
  if (error.ERROR_CODE) {
    vscode.window.showErrorMessage(errMsg);
  }
});
export default {
  activate
};
