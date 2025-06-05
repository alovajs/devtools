import * as vscode from 'vscode';
import { ApiDetailProvider } from './apiDetail';
import { ApiHoverProvider } from './apiHover';
import { ApiServerProvider } from './apiServer';
import { commandMap } from './command';

export const utils = {
  openApiDocs(_apiId: string) {}
};
export function activate(context: vscode.ExtensionContext) {
  // 注册视图
  const apiServerProvider = new ApiServerProvider(context);
  const apiDetailProvider = new ApiDetailProvider(context);
  const apiHoverProvider = new ApiHoverProvider(context);
  const apiServerTreeView = vscode.window.createTreeView('api-docs-server-view', {
    treeDataProvider: apiServerProvider
  });
  const apiDetailWebview = vscode.window.registerWebviewViewProvider('api-docs-detail-view', apiDetailProvider);
  context.subscriptions.push(apiServerTreeView);
  context.subscriptions.push(apiDetailWebview);
  apiServerProvider.onDidChangeTreeData(() => {
    apiDetailProvider.updateView();
  });
  apiServerTreeView.onDidChangeSelection(e => {
    if (e.selection.length > 0) {
      const selectedItem = e.selection[0];
      apiDetailProvider.updateView(selectedItem.api);
    }
  });
  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand(commandMap.refresh.commandId, () => {
      apiServerProvider.refresh();
    })
  );
  // 注册悬停提供器
  vscode.languages.registerHoverProvider('*', apiHoverProvider);
  // 监听活动编辑器变更
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      apiServerProvider.refresh();
    }
  });

  utils.openApiDocs = (apiId: string) => {
    apiServerProvider.refresh();
    const apiTreeItem = apiServerProvider.getItemById(apiId);
    if (apiTreeItem) {
      vscode.commands.executeCommand('workbench.view.extension.api-docs-sidebar');
      apiServerTreeView.reveal(apiTreeItem, { select: true });
      apiDetailProvider.updateView(apiTreeItem.api);
    }
  };
}
export default {
  activate
};
