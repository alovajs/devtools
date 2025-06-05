import { commandsMap } from '@/commands';
import getApis from '@/functions/getApis';
import * as vscode from 'vscode';

export type Trigger = {
  command: string;
  param?: string;
};
// 创建悬浮内容
function createHoverContent(trigger: Trigger): vscode.Hover {
  const content = new vscode.MarkdownString();
  // 添加可点击的命令链接
  if (trigger.command) {
    const param = trigger.param ? `?${encodeURIComponent(trigger.param)}` : '';
    content.appendMarkdown(`[打开Api文档](command:${trigger.command}${param})\n\n`);
  }
  // 必须设置为 true 才能启用命令执行
  content.isTrusted = true;

  return new vscode.Hover(content);
}

// 创建正则表达式来匹配目标字符串（支持换行和空格）
function createTargetRegex(target: string): RegExp {
  // 转义特殊字符
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 允许点前后有空格和换行

  const withSpaces = escaped.replace(/\\./g, `\\s*\\.\\s*`);
  // 允许整个表达式跨行
  return new RegExp(withSpaces, 's');
}
export class ApiHoverProvider implements vscode.HoverProvider {
  constructor(private context: vscode.ExtensionContext) {}
  // eslint-disable-next-line class-methods-use-this
  provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const startLine = Math.max(0, position.line - 10);
    const endLine = Math.min(document.lineCount - 1, position.line);
    const filePath = document.uri.fsPath;
    // 定义需要匹配的目标字符串
    const TARGET_STRINGS = getApis(filePath).map(item => `${item.global}.${item.pathKey}`);
    let contextText = '';
    for (let i = startLine; i <= endLine; i += 1) {
      contextText += `${document.lineAt(i).text}\n`;
    }
    // 计算当前光标在上下文文本中的位置
    let offset = 0;
    for (let i = startLine; i < position.line; i += 1) {
      offset += document.lineAt(i).text.length + 1; // +1 for newline
    }
    offset += position.character;

    // 检查每个目标字符串
    for (const target of TARGET_STRINGS) {
      const regex = createTargetRegex(target);
      let match: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      if ((match = regex.exec(contextText)) !== null) {
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;

        // 检查光标是否在匹配范围内
        if (offset >= startIndex && offset <= endIndex) {
          return createHoverContent({
            command: commandsMap.openDocs.commandId,
            param: JSON.stringify([target])
          });
        }
      }
    }
    return null;
  }
}

export default ApiHoverProvider;
