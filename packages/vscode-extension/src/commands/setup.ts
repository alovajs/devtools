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
    alovaWork.readConfig();
  }
} as Commonand;
