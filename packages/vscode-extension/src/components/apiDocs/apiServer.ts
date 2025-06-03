import * as vscode from 'vscode';

export type ApiTreeItem = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  children?: ApiTreeItem[];
};
export class ApiServerTreeItem extends vscode.TreeItem {
  icon?: string;
  children?: ApiServerTreeItem[];
}
export class ApiServerProvider implements vscode.TreeDataProvider<ApiTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ApiTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private items: ApiTreeItem[] = [];

  constructor(private context: vscode.ExtensionContext) {
    this.loadItems();
  }

  private loadItems(): void {
    const storedItems = this.context.globalState.get<ApiTreeItem[]>('dynamicSidebarItems', []);
    this.items = storedItems;
    process.nextTick(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  private saveItems(): void {
    this.context.globalState.update('dynamicSidebarItems', this.items);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  getItems(): ApiTreeItem[] {
    return this.items;
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

  addItem(): void {
    vscode.window
      .showInputBox({
        prompt: 'Enter item name',
        placeHolder: 'Item name'
      })
      .then(name => {
        if (!name) {
          return;
        }

        const newItem: ApiTreeItem = {
          id: `item-${Date.now()}`,
          label: name,
          icon: 'file'
        };

        this.items.push(newItem);
        this.saveItems();
        this.refresh();
      });
  }

  editItem(item: ApiTreeItem): void {
    vscode.window
      .showInputBox({
        value: item.label,
        prompt: 'Edit item name'
      })
      .then(newName => {
        if (newName && newName !== item.label) {
          item.label = newName;
          this.saveItems();
          this.refresh();
        }
      });
  }

  deleteItem(item: ApiTreeItem): void {
    this.items = this.items.filter(i => i.id !== item.id);
    this.saveItems();
    this.refresh();
  }
}
