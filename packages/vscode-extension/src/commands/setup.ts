import autocomplete from '@/components/autocomplete';
import { outputChannel } from '@/components/message';
import readConfig from '@/functions/readConfig';
import * as vscode from 'vscode';
import showStatusBarIcon from './showStatusBarIcon';
import { getWorkspacePaths } from '@/utils/vscode';
import { registerEvent } from '@/components/event';

export default {
  commandId: 'alova.setup',
  handler: context => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    context.subscriptions.push(autocomplete);
    context.subscriptions.push(outputChannel);
    registerEvent();
    // 读取所有配置文件
    readConfig(getWorkspacePaths());
  }
} as Commonand;
