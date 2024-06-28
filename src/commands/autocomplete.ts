import * as vscode from 'vscode';
import { AUTO_COMPLETE } from '../components/autocomplete';
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
    const result = /(a->)(.*)/.exec(text);
    editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(position.line, result?.index ?? 0), position),
        AUTO_COMPLETE.text
      );
      AUTO_COMPLETE.text = '';
    });
  }
};
