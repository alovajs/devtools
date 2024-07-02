import * as vscode from 'vscode';
import { AUTO_COMPLETE } from '../components/autocomplete';
function countLeadingSpace(str: string): number {
  const match = str.match(/^\s+/);
  return match ? match[0].length : 0;
}
export default {
  commandId: 'alova.autocomplete',
  handler: (context: vscode.ExtensionContext) => () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !AUTO_COMPLETE.text) {
      return;
    }
    const position = editor.selection.active;
    const document = editor.document;
    const text = document.lineAt(position).text.slice(0, position.character);
    const preText = Array(countLeadingSpace(text)).fill(' ').join('');
    let replaceText = AUTO_COMPLETE.text
      .split('\n')
      .map((line, idx) => `${idx > 0 ? preText : ''}${line}`)
      .join('\n')
      .trim();
    const result = /(a->)(.*)/.exec(text);
    editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(position.line, result?.index ?? 0), position),
        replaceText
      );
      AUTO_COMPLETE.text = '';
    });
  }
};
