import autocomplete from '@/components/autocomplete';
import { outputChannel } from '@/components/message';
import readConfig from '@/functions/readConfig';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    // 读取配置文件
    readConfig(true, false);
    context.subscriptions.push(autocomplete);
    context.subscriptions.push(outputChannel);
    vscode.workspace.onDidChangeWorkspaceFolders(event => {
      event.added.forEach(() => {
        // 读取配置文件
        readConfig(true, false);
      });
    });
  }
} as Commonand;
