import type Error from './error'
import * as vscode from 'vscode'
import ApiGenerate from '@/core/ApiGenerate'
import { getWorma } from '@/functions/getWorma'
import { debounce, Log } from '@/utils'
import { getCurrentWorkspacePath } from '@/utils/vscode'

export function showError(err: unknown) {
  const error = err as Error
  Log.error(error, { prompt: !!error.ERROR_CODE })
}
export function registerEvent() {
  // listener workspace directory changes
  vscode.workspace.onDidChangeWorkspaceFolders((event) => {
    event.added.forEach((workspacePath) => {
      if (getWorma()) {
        ApiGenerate.addConfig(`${workspacePath.uri.fsPath}/`)
      }
    })
    event.removed.forEach((workspacePath) => {
      if (getWorma()) {
        ApiGenerate.removeConfig(`${workspacePath.uri.fsPath}/`)
      }
    })
  })
  // listener package.json file changes

  vscode.workspace.onDidChangeTextDocument(
    debounce((event) => {
      const filePath = event.document.uri.fsPath
      if (event.contentChanges.length === 0) {
        return
      }
      if (/package\.json$/.test(filePath) && getWorma()) {
        ApiGenerate.onlyReadConfig(getCurrentWorkspacePath(filePath))
      }
    }, 1000),
  )
  // listener worma.config configuration file changes

  vscode.workspace.onDidSaveTextDocument((event) => {
    const filePath = event.uri.fsPath
    if (/alova\.config\.[cm]?[jt]s$/.test(filePath) && getWorma()) {
      ApiGenerate.onlyReadConfig(getCurrentWorkspacePath(filePath))
    }
  })
  // Listen for errors

  process.on('uncaughtException', (err) => {
    showError(err)
  })
  // Listen for unhandled promise rejection

  process.on('unhandledRejection', (err) => {
    showError(err)
  })
}
export default {
  registerEvent,
}
