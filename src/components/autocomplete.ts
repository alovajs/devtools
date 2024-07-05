import autocomplete from '@/functions/autocomplete';
import * as vscode from 'vscode';

const triggerCharacters: string[] = [' ', '.', '>', ':', '-'];
export const AUTO_COMPLETE = {
  path: '',
  text: ''
};
class AutoComplete extends vscode.CompletionItem {
  autoText: string;
}
export default vscode.languages.registerCompletionItemProvider(
  ['javascript', 'typescript'],
  {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
      // 支持换行 代码从起始位置到输入位置
      const text = document.lineAt(position).text.slice(0, position.character);
      // const linePrefix = ;
      if (/a->.*/.test(text)) {
        const [, value] = /a->(.*)[\s.>:-]?/.exec(text) || [];
        AUTO_COMPLETE.path = document.uri.fsPath;
        return autocomplete(value.trim()).map(item => {
          const completionItem = new AutoComplete(item.path, vscode.CompletionItemKind.Function);
          completionItem.detail = `[${item.method}] ${item.summary}`;
          completionItem.documentation = new vscode.MarkdownString(item.documentation ?? item.replaceText);
          // 代码替换位置，查找位置会同步应用
          completionItem.filterText = item.path;
          completionItem.autoText = item.replaceText;
          completionItem.preselect = true;
          completionItem.command = {
            command: 'alova.autocomplete',
            title: 'Alova completions...'
          };
          return completionItem;
        });
      }
    },
    // 处理选中的CompletionItem
    resolveCompletionItem(item: AutoComplete) {
      AUTO_COMPLETE.text = item.autoText;
      return item;
    }
  },
  ...triggerCharacters // 触发自动补全的字符
);
