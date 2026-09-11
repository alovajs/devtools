import { getExt, is, not, setupTest } from '../../ctx.js'

setupTest('extension-activation', () => {
  it('extension is active after startup', async () => {
    const ext = getExt()
    not(ext, undefined)
    // Activation is asynchronous (`onStartupFinished` / `workspaceContains`),
    // so waiting for it is required — reading `isActive` straight away races
    // the extension host. `activate()` is a no-op once it is already active.
    await ext.activate()
    is(ext.isActive, true)
  })
})
