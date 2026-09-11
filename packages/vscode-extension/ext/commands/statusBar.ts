import * as vscode from 'vscode'
import Global from '@/core/Global'
import { registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

export const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)

/** Number of sources with pending updates — drives the status-bar indicator. */
let updateCount = 0

export function getUpdateCount() {
  return updateCount
}

/**
 * Show (or hide) the "update available" indicator on the status bar.
 *
 * When updates are pending the icon switches to `worma-icon-update` and the
 * label becomes "N update(s)"; otherwise the brand logo + "Worma" is shown.
 * The "not installed" state (`$(circle-slash)`) is independent.
 */
export function setUpdateIndicator(count: number) {
  updateCount = Math.max(0, count)
  render()
}

function render() {
  if (!Global.enabled) {
    statusBarItem.text = `$(circle-slash) Worma`
    statusBarItem.tooltip = 'module `wormajs` not found'
    statusBarItem.color = '#FFFFFF80'
    statusBarItem.command = undefined
    return
  }

  if (updateCount > 0) {
    const label = `${updateCount} update${updateCount > 1 ? 's' : ''}`
    statusBarItem.text = `$(worma-icon-update) ${label}`
    statusBarItem.tooltip = `${label} available, click to review`
    statusBarItem.command = Commands.status_bar_show_actions
    statusBarItem.color = undefined
    return
  }

  statusBarItem.text = `$(worma-icon-id) Worma`
  statusBarItem.tooltip = 'Generate APIs'
  statusBarItem.command = Commands.status_bar_show_actions
  statusBarItem.color = undefined
}

export function loading(text: string = '') {
  Global.setLoading(true)
  statusBarItem.text = `$(sync~spin) ${text} Loading...`
  statusBarItem.tooltip = 'loading'
  statusBarItem.command = undefined
}
export function updateLoadingProgress(percent: number) {
  if (Global.loading) {
    statusBarItem.text = `$(sync~spin) ${Math.round(percent)}%`
  }
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
    render()
  }
}
export function disable() {
  Global.setEnabled(false)
  render()
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
