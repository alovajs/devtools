// Show status bar items
import { utils } from '@/components/apiDocs'
import { registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

export const openDocs: CommandType<[string]> = {
  commandId: Commands.api_docs_open,

  handler: () => async (url: string) => {
    utils.openApiDocs(url)
  },
}

export default <ExtensionModule> function (ctx) {
  return [registerCommand(openDocs, ctx)]
}
