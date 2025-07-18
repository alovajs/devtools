import type * as vscode from 'vscode'
import Global from '@/core/Global'
import Setup from '@/core/Setup'
import { Log } from '@/utils'
import { version } from '../package.json'

export async function activate(ctx: vscode.ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`)
  // commands registration
  Global.init(ctx)
  await Setup.init(ctx)
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
