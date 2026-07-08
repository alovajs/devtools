import { Commands, executeCommand, expect, openFile, setupTest } from '../../ctx'

// The harness launches this action once per declared fixture and tells us
// which one via `E2E_FIXTURE`. The expected config file name follows the
// module system of that example (TypeScript → `worma.config.ts`, else `.js`).
const fixture = process.env.E2E_FIXTURE || 'commonjs'
const configFile = fixture === 'typescript' ? 'worma.config.ts' : 'worma.config.js'

setupTest(`create-config-content (${fixture})`, () => {
  it('generates a worma config matching the project module type', async () => {
    await executeCommand(Commands.create_config)

    expect(await openFile(configFile)).to.matchSnapshot()
  })
})
