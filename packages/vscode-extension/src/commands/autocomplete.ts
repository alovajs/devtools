import * as vscode from 'vscode';
import { Commands } from './commands';

function countLeadingSpace(str: string): number {
  const match = str.match(/^\s+/);
  return match ? match[0].length : 0;
}
export default <CommandType<[string]>>{
  commandId: Commands.autocomplete,
  handler: () => (autoText: string) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const position = editor.selection.active;
    const { document } = editor;
    const text = document.lineAt(position).text.slice(0, position.character);
    const preText = Array(countLeadingSpace(text)).fill(' ').join('');
    const replaceText = autoText
      .split('\n')
      .map((line, idx) => `${idx > 0 ? preText : ''}${line}`)
      .join('\n')
      .trim();
    const result = /(a-(>|》))(.*)/.exec(text);
    editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(position.line, result?.index ?? 0), position),
        replaceText
      );
    });
  }
};
