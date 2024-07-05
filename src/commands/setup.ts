import autocomplete from '@/components/autocomplete';
import readConfig from '@/functions/readConfig';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    // 读取配置文件
    readConfig();
    context.subscriptions.push(autocomplete);
  }
} as Commonand;
