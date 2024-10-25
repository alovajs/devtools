import autocomplete from '@/functions/autocomplete';
import * as vscode from 'vscode';
import autocompleteCommand from '@/commands/autocomplete';

const triggerCharacters: string[] = [' ', '.', '>', ':', '-'];
class AutoComplete extends vscode.CompletionItem {}
export default vscode.languages.registerCompletionItemProvider(
  ['javascript', 'typescript', 'vue', 'javascriptreact', 'typescriptreact', 'svelte'],
  {
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
      // 支持换行 代码从起始位置到输入位置
      const text = document.lineAt(position).text.slice(0, position.character);
      // const linePrefix = ;
      if (/a->.*/.test(text)) {
        const [, value] = /a->(.*)[\s.>:-]?/.exec(text) || [];
        return (await autocomplete(value.trim(), document.uri.fsPath)).map(item => {
          const completionItem = new AutoComplete(item.path, vscode.CompletionItemKind.Function);
          completionItem.detail = `[${item.method}] ${item.summary}`;
          completionItem.documentation = new vscode.MarkdownString(item.documentation ?? item.replaceText);
          // 代码替换位置，查找位置会同步应用
          completionItem.filterText = item.path;
          completionItem.preselect = true;
          completionItem.insertText = '';
          completionItem.command = {
            command: autocompleteCommand.commandId,
            title: 'Alova completions...',
            arguments: [item.replaceText]
          };
          return completionItem;
        });
      }
    }
  },
  ...triggerCharacters // 触发自动补全的字符
);
