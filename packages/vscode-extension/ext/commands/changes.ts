import { showError } from '@/components/event'
import { registerCommand } from '@/utils/vscode'
import { ChangesView } from '@/views/changes'
import { Commands } from './commands'

export const openChanges: CommandType<[string?, string?]> = {
  commandId: Commands.open_changes,
  handler: () => async (changeId?: string, projectPath?: string) => {
    try {
      await ChangesView.open(changeId ?? 'latest', projectPath)
    }
    catch (error) {
      showError(error)
    }
  },
}

export default <ExtensionModule> function (ctx) {
  return [registerCommand(openChanges, ctx)]
}
