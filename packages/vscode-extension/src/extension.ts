import * as vscode from 'vscode'
import apiDocs from '@/components/apiDocs'
import codeSnippet from '@/components/codeSnippet'
import Global from '@/core/Global'
import { Log } from '@/utils'
import { version } from '../package.json'
import commandsModules, { Commands } from './commands'

export async function activate(ctx: vscode.ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`)
  // commands registration
  await Global.init(ctx)
  apiDocs.activate(ctx)
  codeSnippet.activate(ctx)
  const modules = [commandsModules]
  const disposables = modules.map(m => m(ctx)).flat()
  disposables.forEach(d => ctx.subscriptions.push(d))
  vscode.commands.executeCommand(Commands.show_status_bar_icon)
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
