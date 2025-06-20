import * as vscode from 'vscode';
import { ApiCodeLensProvider } from './apiCodeLen';
import { ApiDetailProvider } from './apiDetail';
import { ApiServerProvider } from './apiServer';
import { commandMap } from './command';
// 展开特定视图
export async function expandView(viewId: string) {
  // 聚焦到目标视图
  await vscode.commands.executeCommand(`${viewId}.focus`);
}
export const utils = {
  async openApiDocs(_apiId: string) {}
};
export function activate(context: vscode.ExtensionContext) {
  // 注册视图
  const apiServerProvider = new ApiServerProvider(context);
  const apiDetailProvider = new ApiDetailProvider(context);
  const apiCodeLensProvider = new ApiCodeLensProvider(context);
  const apiServerTreeView = vscode.window.createTreeView('api-docs-server-view', {
    treeDataProvider: apiServerProvider
  });
  const apiDetailWebview = vscode.window.registerWebviewViewProvider('api-docs-detail-view', apiDetailProvider);
  context.subscriptions.push(apiServerTreeView);
  context.subscriptions.push(apiDetailWebview);
  apiServerTreeView.onDidChangeSelection(e => {
    if (e.selection.length > 0) {
      const selectedItem = e.selection[0];
      expandView('api-docs-detail-view');
      apiDetailProvider.updateView(selectedItem.api);
    }
  });
  apiDetailProvider.onWebViewReady(detail => {
    const selectedItem = apiServerTreeView.selection[0];
    if (selectedItem) {
      detail.updateView(selectedItem.api);
    }
  });
  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand(commandMap.refresh.commandId, () => {
      apiServerProvider.refresh();
    })
  );
  // 注册CodeLens提供器
  vscode.languages.registerCodeLensProvider('*', apiCodeLensProvider);
  // 监听活动编辑器变更
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      apiServerProvider.refresh();
    }
  });

  utils.openApiDocs = async (apiId: string) => {
    let apiTreeItem = apiServerProvider.getItemById(apiId);
    if (!apiTreeItem) {
      await apiServerProvider.refresh();
      apiTreeItem = apiServerProvider.getItemById(apiId);
    }
    if (apiTreeItem && !apiServerTreeView.selection.includes(apiTreeItem)) {
      vscode.commands.executeCommand('workbench.view.extension.api-docs-sidebar');
      apiServerTreeView.reveal(apiTreeItem, { select: true, focus: true });
      apiDetailProvider.updateView(apiTreeItem.api);
    }
  };
}
export default {
  activate
};
