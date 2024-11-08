import autocompleteCommand from '@/commands/autocomplete';
import autocomplete from '@/functions/autocomplete';
import * as vscode from 'vscode';

const triggerCharacters: string[] = [' ', '.', '>', ':', '-'];
class AutoComplete extends vscode.CompletionItem {}
export default vscode.languages.registerCompletionItemProvider(
  ['javascript', 'typescript', 'vue', 'javascriptreact', 'typescriptreact', 'svelte'],
  {
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
      // Support newline code from starting position to input position
      const text = document.lineAt(position).text.slice(0, position.character);
      // const linePrefix = ;
      if (/a->.*/.test(text)) {
        const [, value] = /a->(.*)[\s.>:-]?/.exec(text) || [];
        return (await autocomplete(value.trim(), document.uri.fsPath)).map(item => {
          const completionItem = new AutoComplete(item.path, vscode.CompletionItemKind.Function);
          completionItem.detail = `[${item.method}] ${item.summary}`;
          completionItem.documentation = new vscode.MarkdownString(item.documentation ?? item.replaceText);
          // Code replacement position, search position will be applied synchronously
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
  ...triggerCharacters // Characters that trigger auto-completion
);
