import { getExt, is, setupTest } from '../../ctx.js'

setupTest('extension-activation', () => {
  it('extension is active after startup', () => {
    const ext = getExt()
    is(ext?.isActive, true)
  })
})
