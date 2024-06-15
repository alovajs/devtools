import * as vscode from 'vscode';
import readConfig from '../functions/readConfig';
import showStatusBarIcon from './showStatusBarIcon';
export default {
  commandId: 'alova.setup',
  handler: (context: vscode.ExtensionContext) => async () => {
    vscode.commands.executeCommand(showStatusBarIcon.commandId);
    //读取配置文件
    readConfig();
  }
};
