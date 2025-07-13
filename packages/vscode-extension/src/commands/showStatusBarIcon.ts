import * as statusBar from '@/components/statusBar';
import { Commands } from './commands';
// Show status bar items
export default <CommandType>{
  commandId: Commands.show_status_bar_icon,
  handler: context => async () => {
    statusBar.enable();
    statusBar.statusBarItem.show();
    context.subscriptions.push(statusBar.statusBarItem);
  }
};
