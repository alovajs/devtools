import * as statusBar from '@/components/statusBar';
import { registerCommand } from '@/utils/vscode';
import { Commands } from './commands';
// Show status bar items
export const showStatusBarIcon: CommandType = {
  commandId: Commands.show_status_bar_icon,
  handler: () => async () => {
    statusBar.enable();
    statusBar.statusBarItem.show();
  }
};
export default <ExtensionModule>function (ctx) {
  return [registerCommand(showStatusBarIcon, ctx), statusBar.statusBarItem];
};
