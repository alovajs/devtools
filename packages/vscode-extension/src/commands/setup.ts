import autocomplete from '@/components/autocomplete';
import { outputChannel } from '@/components/message';
import readConfig, { updatedConfigPool } from '@/functions/readConfig';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';
import { getWorkspacePaths } from '@/utils/vscode';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    context.subscriptions.push(autocomplete);
    context.subscriptions.push(outputChannel);
    vscode.workspace.onDidChangeWorkspaceFolders(event => {
      event.added.forEach(workspacePath => {
        readConfig(`${workspacePath.uri.fsPath}/`);
      });
      event.removed.forEach(() => {
        readConfig(getWorkspacePaths());
        updatedConfigPool();
      });
    });
    readConfig(getWorkspacePaths());
  }
} as Commonand;
