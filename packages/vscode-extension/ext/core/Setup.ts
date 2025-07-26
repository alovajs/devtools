import type { ExtensionContext } from 'vscode'
import { onDeactivate } from 'reactive-vscode'
import { commands } from 'vscode'
import commandsModules, { Commands } from '@/commands'
import { registerEvent } from '@/components/event'
import { getWormhole } from '@/functions/getWormhole'
import { Log } from '@/utils'
import apiDetail from '@/views/api-detail'
import apiServer from '@/views/api-server'
import ApiGenerate from './ApiGenerate'
import VscodeClient from './VscodeClient'
import '@/components/message'

onDeactivate(() => {
  VscodeClient.deactivate()
})

export default class Setup {
  static async init(ctx: ExtensionContext) {
    Log.info('🚀 Setup start');
    [commandsModules, apiDetail, apiServer]
      .map(m => m(ctx))
      .flat()
      .forEach(d => ctx.subscriptions.push(d))

    commands.executeCommand(Commands.show_status_bar_icon)
    VscodeClient.init(ctx)
    registerEvent()

    if (getWormhole()) {
      await ApiGenerate.onlyReadConfig()
    }
    Log.info('🚀 Setup end')
  }
}
