import autocomplete from '@/components/autocomplete';
import { registerEvent } from '@/components/event';
import { outputChannel } from '@/components/message';
import readConfig from '@/functions/readConfig';
import { getWorkspacePaths } from '@/utils/vscode';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    context.subscriptions.push(autocomplete);
    context.subscriptions.push(outputChannel);
    registerEvent();
    // Read all configuration files
    readConfig(getWorkspacePaths());
  }
} as Commonand;
