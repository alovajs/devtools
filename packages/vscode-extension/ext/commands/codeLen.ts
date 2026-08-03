import type { CancellationToken, CodeLensProvider, ExtensionContext, TextDocument } from 'vscode'
import type { ApiRef, ApiWithSource } from '~/types'
import { CodeLens, EventEmitter, languages, Position, Range, workspace } from 'vscode'
import { commandsMap } from '@/commands'
import { config } from '@/config'
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
    // refresh CodeLens when the document changes
    workspace.onDidChangeTextDocument(() => {
      this._onDidChangeCodeLenses.fire()
    })
    // refresh when the toggle config changes, so show/hide takes effect immediately without restart
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('worma.enableViewApiLens'))
        this._onDidChangeCodeLenses.fire()
    })
  }

  // refresh CodeLens
  public refresh(): void {
    this._onDidChangeCodeLenses.fire()
  }

  private createTargetRegex(target: string): RegExp {
    // escape special characters
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // allow spaces and newlines around the dot
    const withSpaces = escaped.replace(/\\./g, `\\s*\\.\\s*`)

    // Pattern 1: dotted-call match  obj.addPet( / .addPet( / Apis.addPet(
    let pattern = `${withSpaces}\\s*\\(`

    // Pattern 2: with no namespace (target starts with "."), also match bare function-name calls
    // (?<![.\w]) negative lookbehind ensures the previous character is not . or a word character (\w)
    //   ✅ matches: addPet( | =addPet( | <space>addPet( | ;addPet( | !addPet(
    //   ✅ matches: await addPet( | return addPet( | const x = addPet(
    //   ✅ matches: fn(addPet()) | if(addPet()) | [addPet()] | ${addPet()}
    //   ✅ matches: void addPet( | condition ? addPet( : ...
    //   ❌ excluded: obj.addPet( -> covered by Pattern 1, not matched again
    //   ❌ excluded: myAddPet( / _addPet( -> different identifier substrings, correctly rejected
    if (target.startsWith('.')) {
      const bareName = target.slice(1)
      const escapedBare = bareName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      pattern += `|(?<![.\\w])${escapedBare}\\s*\\(`
    }

    return new RegExp(pattern, 'gs')
  }

  private getMatchesWithPositionAndLine(text: string, target: string) {
    // split the text into an array of lines
    const lines = text.split('\n')
    const regex = this.createTargetRegex(target)
    // compute the start position and length of each line
    const lineStarts: number[] = []
    const lineLengths: number[] = []
    let currentPosition = 0

    lines.forEach((line, index) => {
      lineStarts[index] = currentPosition
      lineLengths[index] = line.length
      currentPosition += line.length + 1 // +1 for newline character
    })

    const matches: CodeLensMatch[] = []
    // reset the regex's lastIndex
    regex.lastIndex = 0
    let match: RegExpExecArray | null = regex.exec(text)
    // iterate over all matches
    while (match !== null) {
      const start = match.index
      const end = match.index + match[0].length
      const matchText = match[0]
      // find the start line
      let startLine = -1
      for (let i = 0; i < lines.length; i += 1) {
        if (start >= lineStarts[i] && start < lineStarts[i] + lineLengths[i] + 1) {
          startLine = i
          break
        }
      }

      // find the end line
      let endLine = startLine
      for (let i = startLine; i < lines.length; i += 1) {
        if (end <= lineStarts[i] + lineLengths[i]) {
          endLine = i
          break
        }
      }

      // compute the in-line position
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

      // prevent infinite loop
      if (match.index === regex.lastIndex) {
        regex.lastIndex += 1
      }
      match = regex.exec(text)
    }
    return matches
  }

  // provide CodeLens items
  async provideCodeLenses(document: TextDocument, _token: CancellationToken) {
    // decide whether to show the View Api CodeLens based on the config toggle; shown by default
    if (!config.enableViewApiLens)
      return []

    const codeLenses: CodeLens[] = []
    const filePath = document.uri.fsPath
    const apis = await getApisWithContext(filePath)

    // group by target key (global.name)
    const apiGroups = new Map<string, ApiWithSource[]>()
    for (const api of apis) {
      const targetKey = `.${api.name}`
      if (!apiGroups.has(targetKey)) {
        apiGroups.set(targetKey, [])
      }
      apiGroups.get(targetKey)!.push(api)
    }

    const documentText = document.getText()

    // match each unique target key
    for (const [targetKey, apiGroup] of apiGroups) {
      const matches = this.getMatchesWithPositionAndLine(documentText, targetKey)
      if (matches.length === 0)
        continue

      // build the title
      const sourceCount = apiGroup.length
      const title = sourceCount === 1
        ? `📖 View Api: ${targetKey}`
        : `📖 View Api: ${targetKey} (${sourceCount} sources)`

      // build arguments: pass the necessary info of all matched APIs
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
  // register the CodeLens provider
  return languages.registerCodeLensProvider('*', apiCodeLensProvider)
}
