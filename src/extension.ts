import * as vscode from "vscode";
import acorn from "acorn";
import walk from 'acorn-walk'

let myStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const myCommandId = "alova.start";
  context.subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
      // vscode.window.showInformationMessage("hehehe1");

      // 获取到当前工作区的alova配置文件路径
      const uri = vscode.Uri.file(
        vscode.workspace.workspaceFolders?.[0].uri.fsPath + "/alova.config.js"
      );

      // 读取文件内容
      const fileContent = await vscode.workspace.openTextDocument(uri);

      // 获取文件中的module.exports对象
      const module = {exports: {}}
      const func = new Function('module', fileContent.getText())
      func(module)

      // 查找对应的input属性值
      let inputUrl = ''
      const exportObj: any = module.exports
      for(let childObj of exportObj.generator) {
        if('input' in  childObj) {
          inputUrl = childObj.input
        }
      }

      // 临时显示inputUrl地址 
			vscode.window.showInformationMessage("input: " + inputUrl);
    })
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  myStatusBarItem.command = myCommandId;
  context.subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem)
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem)
  );

  // update status bar item once at start
  updateStatusBarItem();
}

function updateStatusBarItem(): void {
  myStatusBarItem.text = `$(alova-icon-id) can be refresh`;
  myStatusBarItem.show();
}

function getNumberOfSelectedLines(
  editor: vscode.TextEditor | undefined
): number {
  let lines = 0;
  if (editor) {
    lines = editor.selections.reduce(
      (prev, curr) => prev + (curr.end.line - curr.start.line),
      0
    );
  }
  return lines;
}
