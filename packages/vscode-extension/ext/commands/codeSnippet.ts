import type { QuickPick, QuickPickItem } from 'vscode'
import { useActiveTextEditor } from 'reactive-vscode'
import { commands, ThemeIcon, window, workspace } from 'vscode'
import { Commands } from '@/commands'
import autocomplete from '@/functions/autocomplete'
import { registerCommand } from '@/utils/vscode'
// code snippet type definition
export interface CodeSnippet {
  id: string
  name: string
  description: string
  language: string
  code: string
  tags: string[]
}
export async function getAutocompleteCodeSnippet(text: string, filePath: string) {
  return (await autocomplete(text, filePath)).map(item => ({
    id: item.path,
    name: `[${item.method}] ${item.summary}`,
    description: item.path,
    language: '*',
    code: item.replaceText,
    tags: ['alova'],
  } as CodeSnippet))
}

class SnippetManager {
  private snippets: CodeSnippet[] = []
  private quickPick?: QuickPick<QuickPickItem>

  constructor() {
    // initialize example code snippets
    this.loadSnippets()
  }

  // load code snippets
  async loadSnippets(text?: string) {
    const filePath = useActiveTextEditor().value?.document.uri.fsPath ?? ''
    this.snippets = await getAutocompleteCodeSnippet(text ?? '', filePath)
    return this.snippets
  }

  // open the search panel
  public openSnippetSearch() {
    if (!this.quickPick) {
      this.quickPick = window.createQuickPick()
      this.quickPick.placeholder = 'Search snippets...'
      this.quickPick.matchOnDescription = true
      this.quickPick.matchOnDetail = true

      // set the panel title and icon
      this.quickPick.title = 'Snippet Search'
      this.quickPick.buttons = [
        {
          iconPath: new ThemeIcon('add'),
          tooltip: 'Add new snippet',
        },
      ]

      // listen for input changes
      this.quickPick.onDidChangeValue(this.filterSnippets.bind(this))

      // listen for selection events
      this.quickPick.onDidAccept(() => {
        const selection = this.quickPick?.selectedItems[0]
        if (selection) {
          this.insertSnippet(selection)
          this.quickPick?.hide()
        }
      })

      // listen for button clicks
      this.quickPick.onDidTriggerButton(() => {
        this.createNewSnippet()
      })

      // clean up when the panel closes
      this.quickPick.onDidHide(() => {
        this.quickPick?.dispose()
        this.quickPick = undefined
      })
    }

    // initially show all snippets
    this.filterSnippets('')
    this.quickPick.show()
  }

  // filter code snippets
  private async filterSnippets(query: string) {
    if (!this.quickPick) {
      return
    }
    const filtered = await this.loadSnippets(query)
    // convert to QuickPickItem
    this.quickPick.items = filtered.map(snippet => ({
      label: snippet.name,
      description: snippet.description,
      snippet, // store original snippet object
    }))
  }

  // insert code snippet

  private async insertSnippet(item: QuickPickItem) {
    const snippet = (item as any).snippet as CodeSnippet
    const editor = window.activeTextEditor

    if (!editor) {
      window.showErrorMessage('No active editor')
      return
    }

    // check whether the language matches
    const currentLanguage = editor.document.languageId
    if (snippet.language !== '*' && snippet.language !== currentLanguage) {
      const response = await window.showWarningMessage(
        `This snippet is for ${snippet.language}, but the current file is ${currentLanguage}. Insert anyway?`,
        'Yes',
        'No',
      )

      if (response !== 'Yes') {
        return
      }
    }

    // insert code snippet
    editor
      .edit((editBuilder) => {
        const position = editor.selection.active
        editBuilder.insert(position, snippet.code)
      })
      .then(() => {
        // optional: trigger snippet completion (let VS Code handle tab stops)
        commands.executeCommand('editor.action.triggerSuggest')
      })
  }

  // create a new code snippet
  private async createNewSnippet() {
    const name = await window.showInputBox({
      prompt: 'Enter snippet name',
      placeHolder: 'e.g. React Function Component',
    })

    if (!name)
      return

    const description
      = (await window.showInputBox({
        prompt: 'Enter snippet description',
        placeHolder: 'e.g. Create a React function component template',
      })) || ''

    const languages = [
      '*',
      'javascript',
      'typescript',
      'html',
      'css',
      'python',
      'java',
      'csharp',
      'php',
      'vue',
      'javascriptreact',
    ]
    const language
      = (await window.showQuickPick(languages, {
        placeHolder: 'Select applicable language (* for all languages)',
      })) || '*'

    const tagsInput
      = (await window.showInputBox({
        prompt: 'Enter tags (comma separated)',
        placeHolder: 'e.g. react, component',
      })) || ''

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag)

    // open a new editor for entering the code
    const document = await workspace.openTextDocument({
      content: '// Enter your code snippet here\n// Use $1, $2, etc. as cursor positions',
      language: 'javascript',
    })

    await window.showTextDocument(document)

    // listen for editor close to save the code snippet
    const disposable = workspace.onDidCloseTextDocument(async (doc) => {
      if (doc === document) {
        const code = document.getText()

        if (code.trim().length > 10) {
          // simple validation
          const newSnippet: CodeSnippet = {
            id: `custom-${Date.now()}`,
            name,
            description,
            language,
            code,
            tags,
          }

          this.snippets.push(newSnippet)
          window.showInformationMessage(`Snippet "${name}" added!`)
        }
        else {
          window.showWarningMessage('Snippet creation cancelled')
        }

        disposable.dispose()
      }
    })
  }

  // get all snippets (for the command palette)
  public getSnippetsForCommandPalette() {
    return this.snippets.map(snippet => ({
      label: snippet.name,
      description: snippet.description,
      detail: `[${snippet.language}] ${snippet.description}`,
      snippet,
    }))
  }
}

const snippetManager = new SnippetManager()

export const openSnippet: CommandType = {
  commandId: Commands.snippet_search_open,
  handler: () => () => {
    snippetManager.openSnippetSearch()
    snippetManager.loadSnippets()
  },
}
export const insertSnippet: CommandType = {
  commandId: Commands.snippet_search_insert,
  handler: () => async () => {
    const selected = await window.showQuickPick(snippetManager.getSnippetsForCommandPalette(), {
      placeHolder: 'Select a snippet to insert',
      matchOnDescription: true,
      matchOnDetail: true,
    })

    if (selected) {
      const editor = useActiveTextEditor().value
      if (editor) {
        editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, selected.snippet.code)
        })
      }
    }
  },
}
export const helpeSnippet: CommandType = {
  commandId: Commands.snippet_search_show_help,
  handler: () => () => {
    window.showInformationMessage('Use Ctrl+Alt+P (Win/Linux) or Cmd+Alt+P (Mac) to open snippet search')
  },
}
export default <ExtensionModule> function (ctx) {
  return [
    registerCommand(openSnippet, ctx),
    registerCommand(insertSnippet, ctx),
    registerCommand(helpeSnippet, ctx),
  ]
}
