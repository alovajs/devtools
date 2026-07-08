import type { QuickPick, QuickPickItem } from 'vscode'
import { useActiveTextEditor } from 'reactive-vscode'
import { commands, ThemeIcon, window, workspace } from 'vscode'
import { Commands } from '@/commands'
import autocomplete from '@/functions/autocomplete'
import { registerCommand } from '@/utils/vscode'
// 代码片段类型定义
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
    // 初始化示例代码片段
    this.loadSnippets()
  }

  // 加载代码片段
  async loadSnippets(text?: string) {
    const filePath = useActiveTextEditor().value?.document.uri.fsPath ?? ''
    this.snippets = await getAutocompleteCodeSnippet(text ?? '', filePath)
    return this.snippets
  }

  // 打开搜索面板
  public openSnippetSearch() {
    if (!this.quickPick) {
      this.quickPick = window.createQuickPick()
      this.quickPick.placeholder = 'Search snippets...'
      this.quickPick.matchOnDescription = true
      this.quickPick.matchOnDetail = true

      // 设置面板标题和图标
      this.quickPick.title = 'Snippet Search'
      this.quickPick.buttons = [
        {
          iconPath: new ThemeIcon('add'),
          tooltip: 'Add new snippet',
        },
      ]

      // 监听输入变化
      this.quickPick.onDidChangeValue(this.filterSnippets.bind(this))

      // 监听选择事件
      this.quickPick.onDidAccept(() => {
        const selection = this.quickPick?.selectedItems[0]
        if (selection) {
          this.insertSnippet(selection)
          this.quickPick?.hide()
        }
      })

      // 监听按钮点击
      this.quickPick.onDidTriggerButton(() => {
        this.createNewSnippet()
      })

      // 面板关闭时清理
      this.quickPick.onDidHide(() => {
        this.quickPick?.dispose()
        this.quickPick = undefined
      })
    }

    // 初始显示所有片段
    this.filterSnippets('')
    this.quickPick.show()
  }

  // 过滤代码片段
  private async filterSnippets(query: string) {
    if (!this.quickPick) {
      return
    }
    const filtered = await this.loadSnippets(query)
    // 转换为QuickPickItem
    this.quickPick.items = filtered.map(snippet => ({
      label: snippet.name,
      description: snippet.description,
      snippet, // store original snippet object
    }))
  }

  // 插入代码片段

  private async insertSnippet(item: QuickPickItem) {
    const snippet = (item as any).snippet as CodeSnippet
    const editor = window.activeTextEditor

    if (!editor) {
      window.showErrorMessage('No active editor')
      return
    }

    // 检查语言是否匹配
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

    // 插入代码片段
    editor
      .edit((editBuilder) => {
        const position = editor.selection.active
        editBuilder.insert(position, snippet.code)
      })
      .then(() => {
        // 可选：触发代码片段完成（让VS Code处理Tab位）
        commands.executeCommand('editor.action.triggerSuggest')
      })
  }

  // 创建新代码片段
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

    // 打开新编辑器用于输入代码
    const document = await workspace.openTextDocument({
      content: '// Enter your code snippet here\n// Use $1, $2, etc. as cursor positions',
      language: 'javascript',
    })

    await window.showTextDocument(document)

    // 监听编辑器关闭以保存代码片段
    const disposable = workspace.onDidCloseTextDocument(async (doc) => {
      if (doc === document) {
        const code = document.getText()

        if (code.trim().length > 10) {
          // 简单验证
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

  // 获取所有片段（用于命令面板）
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
