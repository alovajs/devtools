import { defineExtension, onDeactivate } from 'reactive-vscode'
import { Commands } from '@/commands'
import { getUpdateCount } from '@/commands/statusBar'
import Global from '@/core/Global'
import Setup from '@/core/Setup'
import UpdateChecker from '@/core/UpdateChecker'
import { MockWorma } from '@/functions/getWorma'
import { getHandlers } from '@/handlers'
import * as Meta from '@/meta'
import { Log } from '@/utils'
import { ChangesView } from '@/views/changes'
import { version } from '../package.json'

onDeactivate(() => {
  Log.info('🈚 Deactivated')
})

const { activate, deactivate } = defineExtension(async (ctx) => {
  Log.info(`🈶 Activated, v${version}`)
  // // commands registration
  Global.init(ctx)
  await Setup.init(ctx)
  ChangesView.init(ctx, getHandlers(ctx))
})

// for vscode
export { activate, deactivate }

// for test
export {
  ChangesView,
  Commands,
  getHandlers,
  getUpdateCount,
  Global,
  Log,
  Meta,
  MockWorma,
  UpdateChecker,
}
