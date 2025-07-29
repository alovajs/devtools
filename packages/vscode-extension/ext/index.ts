import { defineExtension, onDeactivate } from 'reactive-vscode'
import Global from '@/core/Global'
import Setup from '@/core/Setup'
import { Log } from '@/utils'
import { version } from '../package.json'

onDeactivate(() => {
  Log.info('🈚 Deactivated')
})

const { activate, deactivate } = defineExtension(async (ctx) => {
  Log.info(`🈶 Activated, v${version}`)
  // // commands registration
  Global.init(ctx)
  await Setup.init(ctx)
})

export { activate, deactivate }
