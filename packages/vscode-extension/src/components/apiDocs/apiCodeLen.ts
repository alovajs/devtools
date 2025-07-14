import * as vscode from 'vscode'
import { commandsMap } from '@/commands'
import getApis from '@/functions/getApis'

interface CodeLensMatch {
  text: string
  start: number
  end: number
  startLine: number
  endLine: number
  startCol: number
  endCol: number
  lineLengths: number[]
}
export class ApiCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event

  constructor(private context: vscode.ExtensionContext) {
    // 当文档变化时刷新 CodeLens
    vscode.workspace.onDidChangeTextDocument(() => {
      this._onDidChangeCodeLenses.fire()
    })
  }

  // 刷新 CodeLens
  public refresh(): void {
    this._onDidChangeCodeLenses.fire()
  }

  private createTargetRegex(target: string): RegExp {
    // 转义特殊字符
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // 允许点前后有空格和换行
    const withSpaces = escaped.replace(/\\./g, `\\s*\\.\\s*`)
    // 允许整个表达式跨行
    return new RegExp(withSpaces, 's')
  }

  private getMatchesWithPositionAndLine(text: string, target: string) {
    // 分割文本为行数组
    const lines = text.split('\n')
    const regex = new RegExp(this.createTargetRegex(target), 'g')
    // 计算每行的起始位置和长度
    const lineStarts: number[] = []
    const lineLengths: number[] = []
    let currentPosition = 0

    lines.forEach((line, index) => {
      lineStarts[index] = currentPosition
      lineLengths[index] = line.length
      currentPosition += line.length + 1 // +1 for newline character
    })

    const matches: CodeLensMatch[] = []
    // 重置正则表达式的lastIndex
    regex.lastIndex = 0
    let match: RegExpExecArray | null = regex.exec(text)
    // 遍历所有匹配项
    while (match !== null) {
      const start = match.index
      const end = match.index + match[0].length
      const matchText = match[0]
      // 查找起始行
      let startLine = -1
      for (let i = 0; i < lines.length; i += 1) {
        if (start >= lineStarts[i] && start < lineStarts[i] + lineLengths[i] + 1) {
          startLine = i
          break
        }
      }

      // 查找结束行
      let endLine = startLine
      for (let i = startLine; i < lines.length; i += 1) {
        if (end <= lineStarts[i] + lineLengths[i]) {
          endLine = i
          break
        }
      }

      // 计算行内位置
      const startCol = start - lineStarts[startLine]
      const endCol = end - lineStarts[endLine]

      matches.push({
        text: matchText,
        start,
        end,
        startLine,
        endLine,
        startCol,
        endCol,
        lineLengths,
      })

      // 防止无限循环
      if (match.index === regex.lastIndex) {
        regex.lastIndex += 1
      }
      match = regex.exec(text)
    }
    return matches
  }

  // 提供 CodeLens 项
  async provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken) {
    const codeLenses: vscode.CodeLens[] = []
    const filePath = document.uri.fsPath
    // 定义需要匹配的目标字符串
    const TARGET_STRINGS = (await getApis(filePath)).map(item => `${item.global}.${item.pathKey}`)
    const documentText = document.getText()
    const matches: Array<{
      result: CodeLensMatch[]
      target: string
    }> = []
    for (const target of TARGET_STRINGS) {
      matches.push({
        result: this.getMatchesWithPositionAndLine(documentText, target),
        target,
      })
    }
    for (const { target, result } of matches) {
      for (const { startLine, lineLengths } of result) {
        const range = new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(startLine, lineLengths[startLine]),
        )
        const codeLens = new vscode.CodeLens(range, {
          title: `📚 View Api Documentation`,
          tooltip: `Open Api Documentation: ${target}`,
          command: commandsMap.openDocs.commandId,
          arguments: [target],
        })
        codeLenses.push(codeLens)
      }
    }
    return codeLenses
  }
}

export default {
  ApiCodeLensProvider,
}
