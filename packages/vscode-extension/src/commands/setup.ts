import autocomplete from '@/components/autocomplete';
import { outputChannel } from '@/components/message';
import { alovaWork } from '@/helper/work';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    context.subscriptions.push(autocomplete);
    context.subscriptions.push(outputChannel);
    vscode.workspace.onDidChangeWorkspaceFolders(event => {
      event.added.forEach(workspacePath => {
        console.log(workspacePath, 15);
        alovaWork.readConfig(false, `${workspacePath.uri.fsPath}/`);
      });
    });
    alovaWork.readConfig();
  }
} as Commonand;
