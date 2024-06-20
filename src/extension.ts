import * as vscode from 'vscode';
import generateApi from './commands/generateApi';
import refresh from './commands/refresh';
import setup from './commands/setup';
import autocomplete from './commands/autocomplete';
import showStatusBarIcon from './commands/showStatusBarIcon';
// let myStatusBarItem: vscode.StatusBarItem;
const commands = [setup, refresh, showStatusBarIcon, generateApi, autocomplete];

export function activate(context: vscode.ExtensionContext) {
  // 插件注册
  commands.forEach(({ commandId, handler }) => {
    context.subscriptions.push(vscode.commands.registerCommand(commandId, handler(context)));
  });
  vscode.commands.executeCommand(setup.commandId);
}
