import * as statusBar from '@/components/statusBar';
// 显示状态栏项
export default {
  commandId: 'alova.showStatusBarIcon',
  handler: context => async () => {
    statusBar.enable();
    statusBar.statusBarItem.show();
    context.subscriptions.push(statusBar.statusBarItem);
  }
} as Commonand;
