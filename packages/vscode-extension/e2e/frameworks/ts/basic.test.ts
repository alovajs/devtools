import sinon from 'sinon'
import { Commands, executeCommand, expect, getExt, is, MockWormhole, openFile, setupTest } from '../../ctx'

setupTest('ts', () => {
  it('opens entry file', async () => {
    const packageText = await openFile('package.json')
    expect(packageText).to.not.include(`"type": "commonjs"`)
    expect(packageText).to.match(/"typescript": ".+"/)
  })

  it('is active', () => {
    const ext = getExt()
    is(ext?.isActive, true)
  })
  it('createConfig', async () => {
    // Create spies and stubs
    sinon.define(MockWormhole, 'createConfig', () => {})
    const mockCreateConfig = sinon.stub(MockWormhole, 'createConfig').returns(Promise.resolve(undefined))

    // execute command
    await executeCommand(Commands.create_config)

    // Verify that generateConfig is called correctly
    expect(mockCreateConfig.calledOnce).to.equals(true)
  })
  it('createConfig content', async () => {
    await executeCommand(Commands.create_config)
    // Verify that generateConfig is called correctly
    expect(await openFile('alova.config.ts')).to.matchSnapshot()
  })
})
