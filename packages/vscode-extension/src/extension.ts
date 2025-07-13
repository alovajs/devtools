import { commands } from '@/commands';
import setup from '@/commands/setup';
import apiDocs from '@/components/apiDocs';
import codeSnippet from '@/components/codeSnippet';
import Global from '@/core/Global';
import { Log } from '@/utils';
import * as vscode from 'vscode';
import { version } from '../package.json';

export async function activate(context: vscode.ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`);
  // commands registration
  await Global.init(context);
  commands.forEach(({ commandId, handler }) => {
    context.subscriptions.push(vscode.commands.registerCommand(commandId, handler(context)));
  });
  apiDocs.activate(context);
  codeSnippet.activate(context);
  vscode.commands.executeCommand(setup.commandId);
}

export function deactivate() {
  Log.info('🈚 Deactivated');
}
