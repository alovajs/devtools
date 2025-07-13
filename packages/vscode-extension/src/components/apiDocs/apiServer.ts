import Global from '@/core/Global';
import { getApiDocs } from '@/functions/getApis';
import type { Api } from '@alova/wormhole';
import * as vscode from 'vscode';

export type ApiTreeItem = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  parent?: string;
  children?: ApiTreeItem[];
  api?: Api;
};
export class ApiServerTreeItem extends vscode.TreeItem {
  icon?: string;
  children?: ApiServerTreeItem[];
}
function generateApiTooltipContent(api: Api): string {
  return `
## [${api.method}] ${api.path}
---
${api.summary}    
`;
}
export class ApiServerProvider implements vscode.TreeDataProvider<ApiTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ApiTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private items: ApiTreeItem[] = [];

  constructor(private context: vscode.ExtensionContext) {
    Global.onDidChangeConfig(() => {
      this.loadItems();
    });
  }

  private loadItems() {
    return new Promise<void>(resolve => {
      process.nextTick(() => {
        this.init().then(() => {
          this._onDidChangeTreeData.fire();
          resolve();
        });
      });
    });
  }
  async init() {
    const apiDocs = await getApiDocs();
    const projects = apiDocs.map(data => {
      const project: ApiTreeItem = {
        id: data.name,
        label: data.name,
        icon: 'project',
        children: data.apiDocs.map((apiDocs, idx) => {
          const label = `SERVER-${idx + 1}`;
          const server: ApiTreeItem = {
            id: label,
            label,
            parent: data.name,
            icon: 'server',
            children: apiDocs.map(apiDoc => ({
              parent: label,
              id: `${label}-${apiDoc.tag}`,
              label: apiDoc.tag,
              icon: 'folder',
              children: apiDoc.apis.map(api => ({
                parent: `${label}-${apiDoc.tag}`,
                id: `${api.global}.${api.pathKey}`,
                label: `[${api.method}]${api.path}`,
                icon: 'symbol-method',
                api
              }))
            }))
          };
          return server;
        })
      };
      return project;
    });
    this.items = projects;
  }

  refresh() {
    return this.loadItems();
  }
  getItems(): ApiTreeItem[] {
    return this.items;
  }
  getItemById(id: string) {
    const findInNodes = (nodes: ApiTreeItem[]): ApiTreeItem | undefined => {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        if (node.children?.length) {
          const found = findInNodes(node.children);
          if (found) {
            return found;
          }
        }
      }
    };
    return findInNodes(this.items);
  }

  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: ApiTreeItem): ApiServerTreeItem {
    const item = new ApiServerTreeItem(
      element.label,
      element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );

    item.description = element.description;
    item.id = element.id;
    item.contextValue = 'tree-item';
    // 设置 tooltip（支持 Markdown）
    if (element.api) {
      item.tooltip = new vscode.MarkdownString(generateApiTooltipContent(element.api), true);
      item.tooltip.supportHtml = true; // 启用 HTML 支持
      item.tooltip.isTrusted = true; // 信任内容（允许执行命令）
    }
    if (element.icon) {
      item.iconPath = new vscode.ThemeIcon(element.icon);
    }

    return item;
  }

  getChildren(element?: ApiTreeItem): Thenable<ApiTreeItem[]> {
    if (element) {
      return Promise.resolve(element.children || []);
    }
    return Promise.resolve(this.items);
  }
  getParent(element: ApiTreeItem): Thenable<ApiTreeItem | undefined> {
    return Promise.resolve(this.getItemById(element.parent ?? ''));
  }
}
