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
      // console.log(fileContent.getText(), "data");

      // 将文件内容解析成ast结构
      const ast = acorn.parse(fileContent.getText(), {
        ecmaVersion: 2020,
      });

			let inputUrl = ''
      // 搜索配置文件，获取配置文件中的input属性
			walk.simple(ast, {
				Property(node: any) {
					if(node.key.name === 'input') {
						inputUrl = node.value.value
					}
				}
			})
			console.log(inputUrl, 'inputUrl');
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
