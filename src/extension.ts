import * as vscode from 'vscode';
import autocomplete from './commands/autocomplete';
import generateApi from './commands/generateApi';
import refresh from './commands/refresh';
import setup from './commands/setup';
import showStatusBarIcon from './commands/showStatusBarIcon';
import Error from './components/error';
import { log } from './components/message';
import './globalConfig';

const commands = [setup, autocomplete, generateApi, refresh, showStatusBarIcon];

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
  log(errMsg);
  if (error.ERROR_CODE) {
    vscode.window.showErrorMessage(errMsg);
  }
});
export default {
  activate
};
