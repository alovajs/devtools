import { actionGen, actionInit } from '@/bin/actions'
import { createConfig, generate, readConfig, resolveWorkspaces } from '@/index'

const generatingConfig = {
  generator: [
    {
      input: 'http://localhost:3000/',
      output: 'src/api',
      type: 'module',
      version: 3,
    },
  ],
}
vi.mock('@/index', () => ({
  __esModule: true,
  createConfig: vi.fn(),
  generate: vi.fn().mockImplementation(({ generator }) => Array.from({ length: generator.length }).map(() => true)),
  readConfig: vi.fn().mockImplementation(() => generatingConfig),
  resolveWorkspaces: vi.fn().mockImplementation(() => ['./packages/test-pkg-1', './packages/test-pkg-2']),
}))
describe('cli', () => {
  it('should get the right `init` cli args', async () => {
    await actionInit({ type: 'commonjs' })
    expect(createConfig).toBeCalledWith({ type: 'commonjs', template: undefined, projectPath: undefined })

    await actionInit({ project: '/mock_path' })
    expect(createConfig).toBeCalledWith({ type: undefined, template: undefined, projectPath: '/mock_path' })

    await actionInit({ template: 'axios' })
    expect(createConfig).toBeCalledWith({ type: undefined, template: 'axios', projectPath: undefined })

    await actionInit({ type: 'typescript', template: 'fetch', project: '/mock_path' })
    expect(createConfig).toBeCalledWith({ type: 'typescript', template: 'fetch', projectPath: '/mock_path' })
  })

  it('should get the right `gen` cli args in workspace mode (default)', async () => {
    await actionGen({})
    expect(resolveWorkspaces).toHaveBeenCalledTimes(1)
    expect(resolveWorkspaces).toHaveBeenCalledWith()
    expect(readConfig).toHaveBeenCalledTimes(2)
    expect(readConfig).toHaveBeenNthCalledWith(1, './packages/test-pkg-1')
    expect(readConfig).toHaveBeenNthCalledWith(2, './packages/test-pkg-2')
    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate).toHaveBeenNthCalledWith(1, generatingConfig, expect.objectContaining({
      force: undefined,
      projectPath: './packages/test-pkg-1',
      onProgress: expect.any(Function),
    }))
    expect(generate).toHaveBeenNthCalledWith(2, generatingConfig, expect.objectContaining({
      force: undefined,
      projectPath: './packages/test-pkg-2',
      onProgress: expect.any(Function),
    }))
  })

  it('should get the right `gen` cli args in single project mode (-p)', async () => {
    vi.clearAllMocks()
    await actionGen({ project: '/mock_path', force: true })
    expect(resolveWorkspaces).not.toHaveBeenCalled()
    expect(readConfig).toHaveBeenCalledTimes(1)
    expect(readConfig).toHaveBeenNthCalledWith(1, '/mock_path')
    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenNthCalledWith(1, generatingConfig, expect.objectContaining({
      force: true,
      projectPath: '/mock_path',
      onProgress: expect.any(Function),
    }))
  })
})
