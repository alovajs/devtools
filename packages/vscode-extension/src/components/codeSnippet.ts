import { Commands } from '@/commands';
import autocomplete from '@/functions/autocomplete';
import * as vscode from 'vscode';
// 代码片段类型定义
export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  tags: string[];
}
export const getAutocompleteCodeSnippet = async (text: string, filePath: string): Promise<CodeSnippet[]> =>
  (await autocomplete(text, filePath)).map(item => {
    const codeSnippet: CodeSnippet = {
      id: item.path,
      name: `[${item.method}] ${item.summary}`,
      description: item.path,
      language: '*',
      code: item.replaceText,
      tags: ['alova']
    };
    return codeSnippet;
  });

class SnippetManager {
  private snippets: CodeSnippet[] = [];
  private quickPick?: vscode.QuickPick<vscode.QuickPickItem>;

  constructor() {
    // 初始化示例代码片段
    this.loadSnippets();
  }

  // 加载代码片段
  async loadSnippets(text?: string) {
    const filePath = vscode.window.activeTextEditor?.document.uri.fsPath ?? '';
    this.snippets = await getAutocompleteCodeSnippet(text ?? '', filePath);
    return this.snippets;
  }

  // 打开搜索面板
  public openSnippetSearch() {
    if (!this.quickPick) {
      this.quickPick = vscode.window.createQuickPick();
      this.quickPick.placeholder = '搜索代码片段...';
      this.quickPick.matchOnDescription = true;
      this.quickPick.matchOnDetail = true;

      // 设置面板标题和图标
      this.quickPick.title = '代码片段搜索';
      this.quickPick.buttons = [
        {
          iconPath: new vscode.ThemeIcon('add'),
          tooltip: '添加新代码片段'
        }
      ];

      // 监听输入变化
      this.quickPick.onDidChangeValue(this.filterSnippets.bind(this));

      // 监听选择事件
      this.quickPick.onDidAccept(() => {
        const selection = this.quickPick?.selectedItems[0];
        if (selection) {
          this.insertSnippet(selection);
          this.quickPick?.hide();
        }
      });

      // 监听按钮点击
      this.quickPick.onDidTriggerButton(() => {
        this.createNewSnippet();
      });

      // 面板关闭时清理
      this.quickPick.onDidHide(() => {
        this.quickPick?.dispose();
        this.quickPick = undefined;
      });
    }

    // 初始显示所有片段
    this.filterSnippets('');
    this.quickPick.show();
  }

  // 过滤代码片段
  private async filterSnippets(query: string) {
    if (!this.quickPick) return;
    const filtered = await this.loadSnippets(query);
    // 转换为QuickPickItem
    this.quickPick.items = filtered.map(snippet => ({
      label: snippet.name,
      description: snippet.description,
      detail: `语言: ${snippet.language === '*' ? '所有' : snippet.language}`,
      snippet // 存储原始片段对象
    }));
  }

  // 插入代码片段
  // eslint-disable-next-line class-methods-use-this
  private async insertSnippet(item: vscode.QuickPickItem) {
    const snippet = (item as any).snippet as CodeSnippet;
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('没有活动的编辑器');
      return;
    }

    // 检查语言是否匹配
    const currentLanguage = editor.document.languageId;
    if (snippet.language !== '*' && snippet.language !== currentLanguage) {
      const response = await vscode.window.showWarningMessage(
        `此代码片段适用于 ${snippet.language}，当前文件是 ${currentLanguage}。是否仍要插入？`,
        '是',
        '否'
      );

      if (response !== '是') {
        return;
      }
    }

    // 插入代码片段
    editor
      .edit(editBuilder => {
        const position = editor.selection.active;
        editBuilder.insert(position, snippet.code);
      })
      .then(() => {
        // 可选：触发代码片段完成（让VS Code处理Tab位）
        vscode.commands.executeCommand('editor.action.triggerSuggest');
      });
  }

  // 创建新代码片段
  private async createNewSnippet() {
    const name = await vscode.window.showInputBox({
      prompt: '输入代码片段名称',
      placeHolder: '例如: React函数组件'
    });

    if (!name) return;

    const description =
      (await vscode.window.showInputBox({
        prompt: '输入代码片段描述',
        placeHolder: '例如: 创建React函数组件模板'
      })) || '';

    const languages = [
      '*',
      'javascript',
      'typescript',
      'html',
      'css',
      'python',
      'java',
      'csharp',
      'php',
      'vue',
      'javascriptreact'
    ];
    const language =
      (await vscode.window.showQuickPick(languages, {
        placeHolder: '选择适用语言 (* 表示所有语言)'
      })) || '*';

    const tagsInput =
      (await vscode.window.showInputBox({
        prompt: '输入标签（逗号分隔）',
        placeHolder: '例如: react, component'
      })) || '';

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    // 打开新编辑器用于输入代码
    const document = await vscode.workspace.openTextDocument({
      content: '// 在此输入您的代码片段\n// 使用 $1, $2 等作为光标位置',
      language: 'javascript'
    });

    await vscode.window.showTextDocument(document);

    // 监听编辑器关闭以保存代码片段
    const disposable = vscode.workspace.onDidCloseTextDocument(async doc => {
      if (doc === document) {
        const code = document.getText();

        if (code.trim().length > 10) {
          // 简单验证
          const newSnippet: CodeSnippet = {
            id: `custom-${Date.now()}`,
            name,
            description,
            language,
            code,
            tags
          };

          this.snippets.push(newSnippet);
          vscode.window.showInformationMessage(`代码片段 "${name}" 已添加!`);
        } else {
          vscode.window.showWarningMessage('代码片段创建已取消');
        }

        disposable.dispose();
      }
    });
  }

  // 获取所有片段（用于命令面板）
  public getSnippetsForCommandPalette() {
    return this.snippets.map(snippet => ({
      label: snippet.name,
      description: snippet.description,
      detail: `[${snippet.language}] ${snippet.description}`,
      snippet
    }));
  }
}

export function activate(context: vscode.ExtensionContext) {
  const snippetManager = new SnippetManager();

  // 注册快捷键命令
  const openSearchCommand = vscode.commands.registerCommand(Commands.snippet_search_open, () => {
    snippetManager.openSnippetSearch();
    snippetManager.loadSnippets();
  });

  // 注册命令面板命令
  const insertSnippetCommand = vscode.commands.registerCommand(Commands.snippet_search_insert, async () => {
    const snippets = snippetManager.getSnippetsForCommandPalette();
    const selected = await vscode.window.showQuickPick(snippets, {
      placeHolder: '选择要插入的代码片段',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selected) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit(editBuilder => {
          editBuilder.insert(editor.selection.active, (selected as any).snippet.code);
        });
      }
    }
  });

  context.subscriptions.push(openSearchCommand, insertSnippetCommand);

  // 添加快捷键说明
  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.snippet_search_show_help, () => {
      vscode.window.showInformationMessage('使用 Ctrl+Alt+P (Win/Linux) 或 Cmd+Alt+P (Mac) 打开代码片段搜索');
    })
  );
}

export function deactivate() {}

export default {
  activate,
  deactivate
};
