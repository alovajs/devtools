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
    expect(createConfig).toBeCalledWith({ type: 'commonjs' })

    await actionInit({ cwd: '/mock_path' })
    expect(createConfig).toBeCalledWith({ projectPath: '/mock_path' })
  })

  it('should get the right `gen` cli args', async () => {
    await actionGen({})
    expect(resolveWorkspaces).toHaveBeenCalledTimes(1)
    expect(resolveWorkspaces).toHaveBeenCalledWith(undefined)
    expect(readConfig).toHaveBeenCalledTimes(2)
    expect(readConfig).toHaveBeenNthCalledWith(1, './packages/test-pkg-1')
    expect(readConfig).toHaveBeenNthCalledWith(2, './packages/test-pkg-2')
    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate).toHaveBeenNthCalledWith(1, generatingConfig, {
      force: undefined,
      projectPath: undefined,
    })
    expect(generate).toHaveBeenNthCalledWith(2, generatingConfig, {
      force: undefined,
      projectPath: undefined,
    })

    vi.clearAllMocks()
    await actionGen({ workspace: false, cwd: '/mock_path', force: true })
    expect(resolveWorkspaces).not.toHaveBeenCalled()
    expect(readConfig).toHaveBeenCalledTimes(1)
    expect(readConfig).toHaveBeenNthCalledWith(1, undefined)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenNthCalledWith(1, generatingConfig, {
      force: true,
      projectPath: '/mock_path',
    })
  })
})
