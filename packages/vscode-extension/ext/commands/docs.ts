import VscodeClient from '@/core/VscodeClient'
import { Log } from '@/utils'
import { expandView, registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

export class AppiDocs {
  static async openDocs(url: string) {
    Log.info(`Open docs: ${url}`)
    expandView('api-docs-sidebar')
    VscodeClient.openDocs(url)
  }

  static async refreshDocs() {
    Log.info(`Refresh docs`)
  }
}
export const openDocs: CommandType<[string]> = {
  commandId: Commands.api_docs_open,
  handler: () => async (url: string) => {
    AppiDocs.openDocs(url)
  },
}
export const refreshDocs: CommandType = {
  commandId: Commands.api_docs_refresh,
  handler: () => () => {
    VscodeClient.refreshDocs()
  },
}
export default <ExtensionModule> function (ctx) {
  return [registerCommand(openDocs, ctx), registerCommand(refreshDocs, ctx)]
}
