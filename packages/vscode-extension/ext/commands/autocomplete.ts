import * as vscode from 'vscode'
import autocompleteFun from '@/functions/autocomplete'
import { registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

function countLeadingSpace(str: string): number {
  const match = str.match(/^\s+/)
  return match ? match[0].length : 0
}
export const autocomplete: CommandType<[string]> = {
  commandId: Commands.autocomplete,
  handler: () => (autoText: string) => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }
    const position = editor.selection.active
    const { document } = editor
    const text = document.lineAt(position).text.slice(0, position.character)
    const preText = Array.from({ length: countLeadingSpace(text) })
      .fill(' ')
      .join('')
    const replaceText = autoText
      .split('\n')
      .map((line, idx) => `${idx > 0 ? preText : ''}${line}`)
      .join('\n')
      .trim()
    const result = /a-[>》].*/.exec(text)
    editor.edit((editBuilder) => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(position.line, result?.index ?? 0), position),
        replaceText,
      )
    })
  },
}
const triggerCharacters: string[] = [' ', '.', '>', '》', ':', '-']
class AutoComplete extends vscode.CompletionItem {}
const autocompleteProvider = vscode.languages.registerCompletionItemProvider(
  ['javascript', 'typescript', 'vue', 'javascriptreact', 'typescriptreact', 'svelte'],
  {
    async provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      _,
      _context: vscode.CompletionContext,
    ) {
      // Support newline code from starting position to input position
      const text = document.lineAt(position).text.slice(0, position.character)
      // const linePrefix = ;
      if (/a-[>》].*/.test(text)) {
        const [, , value] = /a-(>|》)(.*)[\s.>:-]?/.exec(text) || []
        return (await autocompleteFun(value.trim(), document.uri.fsPath)).map((item) => {
          const completionItem = new AutoComplete(item.path, vscode.CompletionItemKind.Function)
          completionItem.detail = `[${item.method}] ${item.summary}`
          completionItem.documentation = new vscode.MarkdownString(item.documentation ?? item.replaceText)
          // Code replacement position, search position will be applied synchronously
          completionItem.filterText = item.path
          completionItem.preselect = true
          completionItem.insertText = ''
          completionItem.command = {
            command: autocomplete.commandId,
            title: 'Alova completions...',
            arguments: [item.replaceText],
          }
          return completionItem
        })
      }
    },
  },
  ...triggerCharacters, // Characters that trigger auto-completion
)
export default <ExtensionModule> function (ctx) {
  return [registerCommand(autocomplete, ctx), autocompleteProvider]
}
