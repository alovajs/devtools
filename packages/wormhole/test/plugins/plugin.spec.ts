import { resolve } from 'node:path'
import { createPlugin } from '@/plugins'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('plugin test', () => {
  it('should apply plugin correctly', async () => {
    const applyFn = vi.fn()
    const nullPlugin = createPlugin(() => ({
      extends: {
        handleApi: (apiDescriptor) => {
          applyFn(apiDescriptor)
          return null
        },
      },
    }))

    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [nullPlugin()],
    )

    expect(apiDefinitionsFile).not.toBeUndefined()
    // should generate a empty api interface
    expect(globalsFile).toMatch('interface Apis {}')
    expect(applyFn).toHaveBeenCalled()
  })
})
