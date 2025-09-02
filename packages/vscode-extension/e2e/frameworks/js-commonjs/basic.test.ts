import { expect, getExt, Global, is, not, openFile, setupTest, timeout } from '../../ctx'

setupTest('js-commonjs', () => {
  it('opens entry file', async () => {
    await openFile('package.json')
  })

  it('is active', () => {
    const ext = getExt()
    is(ext?.isActive, true)
  })
  it('should works', async () => {
    await timeout(500)
    not(Global, undefined)
    expect(1 + 1).to.matchSnapshot()
  })
})
