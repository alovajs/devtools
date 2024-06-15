import * as vscode from 'vscode';
import generateApi from './commands/generateApi';
import refresh from './commands/refresh';
import setup from './commands/setup';
import showStatusBarIcon from './commands/showStatusBarIcon';
// let myStatusBarItem: vscode.StatusBarItem;
const commands = [setup, refresh, showStatusBarIcon, generateApi];

export function activate(context: vscode.ExtensionContext) {
  // 插件注册
  commands.forEach(({ commandId, handler }) => {
    context.subscriptions.push(vscode.commands.registerCommand(commandId, handler(context)));
  });
  vscode.commands.executeCommand(setup.commandId);
  // create a new status bar item that we can now manage
  // const myCommandId = 'alova.start';
  // myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  // myStatusBarItem.command = myCommandId;
  // context.subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
  // context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

  // update status bar item once at start
  // updateStatusBarItem();
}

// function updateStatusBarItem(): void {
//   myStatusBarItem.text = `$(alova-icon-id) can be refresh`;
//   myStatusBarItem.show();
// }
