import sinon from 'sinon'
import { Commands, executeCommand, expect, MockWorma, setupTest } from '../../ctx'

setupTest('create-config command', () => {
  it('invokes worma.createConfig exactly once', async () => {
    // `MockWorma` starts as an empty stub object, so the property must be
    // defined before it can be stubbed.
    sinon.define(MockWorma, 'createConfig', () => {})
    const stub = sinon.stub(MockWorma, 'createConfig').returns(Promise.resolve(undefined))

    await executeCommand(Commands.create_config)

    expect(stub.calledOnce).to.equals(true)
  })
})
