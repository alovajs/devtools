import * as vscode from 'vscode';
import { ApiDetailProvider } from './apiDetail';
import type { ApiTreeItem } from './apiServer';
import { ApiServerProvider } from './apiServer';
import { commandMap } from './command';

export function activate(context: vscode.ExtensionContext) {
  // 注册视图
  const apiServerProvider = new ApiServerProvider(context);
  const apiDetailProvider = new ApiDetailProvider(context);
  const apiServerTreeView = vscode.window.createTreeView('api-docs-server-view', {
    treeDataProvider: apiServerProvider
  });
  const apiDetailWebview = vscode.window.registerWebviewViewProvider('api-docs-detail-view', apiDetailProvider);
  context.subscriptions.push(apiServerTreeView);
  context.subscriptions.push(apiDetailWebview);
  apiServerProvider.onDidChangeTreeData(() => {
    apiDetailProvider.updateView(apiServerProvider.getItems());
  });
  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand(commandMap.addItem.commandId, () => {
      apiServerProvider.addItem();
    }),

    vscode.commands.registerCommand(commandMap.refresh.commandId, () => {
      apiServerProvider.refresh();
      apiDetailProvider.updateView(apiServerProvider.getItems());
    }),

    vscode.commands.registerCommand(commandMap.editItem.commandId, (item: ApiTreeItem) => {
      apiServerProvider.editItem(item);
    }),

    vscode.commands.registerCommand(commandMap.deleteItem.commandId, (item: ApiTreeItem) => {
      apiServerProvider.deleteItem(item);
    })
  );
}
export default {
  activate
};
