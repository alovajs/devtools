import autocomplete from '@/components/autocomplete';
import { registerEvent } from '@/components/event';
import '@/components/message';
import { getWormhole } from '@/functions/getWormhole';
import readConfig from '@/functions/readConfig';
import { getWorkspacePaths } from '@/utils/vscode';
import * as vscode from 'vscode';
import { Commands } from './commands';

export default <CommandType>{
  commandId: Commands.setup,
  handler: context => async () => {
    vscode.commands.executeCommand(Commands.show_status_bar_icon);
    context.subscriptions.push(autocomplete);
    registerEvent();
    // Read all configuration files
    if (getWormhole()) {
      readConfig(getWorkspacePaths());
    }
  }
};
