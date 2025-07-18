import * as vscode from 'vscode'
import { Commands } from '@/commands'
import Global from '@/core/Global'

export const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
export function loading(text: string = '') {
  Global.setLoading(true)
  statusBarItem.text = `$(sync~spin) ${text} Loading...`
  statusBarItem.tooltip = 'loading'
  statusBarItem.command = undefined
}
export function endLoading() {
  Global.setLoading(false)
  if (Global.enabled) {
    enable()
  }
  else {
    disable()
  }
}
export function enable() {
  Global.setEnabled(true)
  if (!Global.loading) {
    statusBarItem.text = `$(alova-icon-id) Alova`
    statusBarItem.tooltip = 'Generate APIs'
    statusBarItem.command = Commands.refresh
    statusBarItem.color = undefined
  }
}
export function disable() {
  Global.setEnabled(false)
  statusBarItem.text = `$(alova-icon-id) Alova`
  statusBarItem.tooltip = 'module `@alova/wormhole` not found'
  statusBarItem.color = '#808080' // Set color to gray
  statusBarItem.command = undefined
}
