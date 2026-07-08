import sinon from 'sinon'
import { Commands, executeCommand, expect, MockWorma, setupTest } from '../../ctx'

setupTest('generate-api command', () => {
  it('runs the generator through the refresh action', async () => {
    // `MockWorma` starts as an empty stub object, so the property must be
    // defined before it can be stubbed.
    sinon.define(MockWorma, 'generate', () => Promise.resolve([true]))
    const stub = sinon.stub(MockWorma, 'generate').returns(Promise.resolve([true]))

    await executeCommand(Commands.refresh)

    expect(stub.called).to.equals(true)
  })
})
