import * as statusBar from '@/components/statusBar';
// Show status bar items
export default {
  commandId: 'alova.showStatusBarIcon',
  handler: context => async () => {
    statusBar.enable();
    statusBar.statusBarItem.show();
    context.subscriptions.push(statusBar.statusBarItem);
  }
} as Commonand;
