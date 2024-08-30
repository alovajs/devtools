import autocomplete from '@/components/autocomplete';
import { outputChannel } from '@/components/message';
import readConfig from '@/functions/readConfig';
import { highPrecisionInterval } from '@/utils';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    context.subscriptions.push(autocomplete);
    context.subscriptions.push(outputChannel);
    // 读取所有配置文件
    highPrecisionInterval(() => {
      // 获得所有工作区
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      for (const workspaceFolder of workspaceFolders) {
        readConfig(`${workspaceFolder.uri.fsPath}/`);
      }
    }, 500);
  }
} as Commonand;
