import type { CancellationToken, CodeLensProvider, ExtensionContext, TextDocument } from 'vscode'
import type { ApiRef, ApiWithSource } from '~/types'
import { CodeLens, EventEmitter, languages, Position, Range, workspace } from 'vscode'
import { commandsMap } from '@/commands'
import { getApisWithContext } from '@/functions/getApis'

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
export class ApiCodeLensProvider implements CodeLensProvider {
  private _onDidChangeCodeLenses = new EventEmitter<void>()
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event

  constructor(private context: ExtensionContext) {
    // 当文档变化时刷新 CodeLens
    workspace.onDidChangeTextDocument(() => {
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

    // Pattern 1: 带点调用匹配  obj.addPet( / .addPet( / Apis.addPet(
    let pattern = `${withSpaces}\\s*\\(`

    // Pattern 2: 无命名空间时(target 以 "." 开头)，增加裸函数名调用匹配
    // (?<![.\w]) 负向 lookbehind 确保前一个字符不是 . 或单词字符(\w)
    //   ✅ 可匹配: addPet( | =addPet( | <空格>addPet( | ;addPet( | !addPet(
    //   ✅ 可匹配: await addPet( | return addPet( | const x = addPet(
    //   ✅ 可匹配: fn(addPet()) | if(addPet()) | [addPet()] | ${addPet()}
    //   ✅ 可匹配: void addPet( | condition ? addPet( : ...
    //   ❌ 排除: obj.addPet( → 由 Pattern 1 覆盖，不重复匹配
    //   ❌ 排除: myAddPet( / _addPet( → 不同标识符子串，正确拒绝
    if (target.startsWith('.')) {
      const bareName = target.slice(1)
      const escapedBare = bareName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      pattern += `|(?<![.\\w])${escapedBare}\\s*\\(`
    }

    return new RegExp(pattern, 'gs')
  }

  private getMatchesWithPositionAndLine(text: string, target: string) {
    // 分割文本为行数组
    const lines = text.split('\n')
    const regex = this.createTargetRegex(target)
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
  async provideCodeLenses(document: TextDocument, _token: CancellationToken) {
    const codeLenses: CodeLens[] = []
    const filePath = document.uri.fsPath
    const apis = await getApisWithContext(filePath)

    // 按 target key (global.name) 分组
    const apiGroups = new Map<string, ApiWithSource[]>()
    for (const api of apis) {
      const targetKey = `.${api.name}`
      if (!apiGroups.has(targetKey)) {
        apiGroups.set(targetKey, [])
      }
      apiGroups.get(targetKey)!.push(api)
    }

    const documentText = document.getText()

    // 对每个唯一的 target key 进行匹配
    for (const [targetKey, apiGroup] of apiGroups) {
      const matches = this.getMatchesWithPositionAndLine(documentText, targetKey)
      if (matches.length === 0)
        continue

      // 构建标题
      const sourceCount = apiGroup.length
      const title = sourceCount === 1
        ? `📖 View Api: ${targetKey}`
        : `📖 View Api: ${targetKey} (${sourceCount} sources)`

      // 构建参数：传递所有匹配 API 的必要信息
      const apiRefs: ApiRef[] = apiGroup.map(api => ({
        uniqueKey: `${api.projectName}/${api.serverIndex}/${api.name}`,
        serverName: api.serverName,
        serverPath: api.serverPath,
        method: api.method,
        path: api.path,
        summary: api.summary,
        targetKey,
      }))

      for (const match of matches) {
        const range = new Range(
          new Position(match.startLine, 0),
          new Position(match.startLine, match.lineLengths[match.startLine]),
        )
        const codeLens = new CodeLens(range, {
          title,
          command: commandsMap.openDocs.commandId,
          arguments: [apiRefs],
        })
        codeLenses.push(codeLens)
      }
    }

    return codeLenses
  }
}

export default <ExtensionModule> function (ctx) {
  const apiCodeLensProvider = new ApiCodeLensProvider(ctx)
  // 注册CodeLens提供器
  return languages.registerCodeLensProvider('*', apiCodeLensProvider)
}
