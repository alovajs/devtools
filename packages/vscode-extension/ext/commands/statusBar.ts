import * as vscode from 'vscode'
import Global from '@/core/Global'
import { registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

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
// Show status bar items
export const showStatusBarIcon: CommandType = {
  commandId: Commands.show_status_bar_icon,
  handler: () => async () => {
    enable()
    statusBarItem.show()
  },
}
export default <ExtensionModule> function (ctx) {
  return [registerCommand(showStatusBarIcon, ctx), statusBarItem]
}
