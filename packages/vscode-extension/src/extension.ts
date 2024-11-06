import { commands } from '@/commands';
import setup from '@/commands/setup';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // 插件注册
  commands.forEach(({ commandId, handler }) => {
    context.subscriptions.push(vscode.commands.registerCommand(commandId, handler(context)));
  });
  vscode.commands.executeCommand(setup.commandId);
}

export default {
  activate
};
