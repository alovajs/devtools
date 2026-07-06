import { actionGen, actionInit } from '@/bin/actions'
import { createConfig, readConfig, resolveWorkspaces } from '@/index'

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

const { mockMultiGenRenderer, mockMultiProjRenderer, mockGenerate } = vi.hoisted(() => ({
  mockMultiGenRenderer: vi.fn(),
  mockMultiProjRenderer: vi.fn(),
  mockGenerate: vi.fn().mockResolvedValue([true]),
}))

vi.mock('@/index', () => ({
  __esModule: true,
  createConfig: vi.fn(),
  readConfig: vi.fn(() => generatingConfig),
  resolveWorkspaces: vi.fn(() => ['./packages/test-pkg-1', './packages/test-pkg-2']),
}))

vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>()
  return {
    ...actual,
    resolveConfigFile: vi.fn(() => './mock/worma.config.ts'),
  }
})

vi.mock('@/generate', () => ({
  default: mockGenerate,
}))

vi.mock('../src/bin/renderer', async (importOriginal) => {
  const actual = await importOriginal<{ InitRenderer: any, INIT_TEMPLATE_CHOICES: any, MultiGeneratorRenderer: any, MultiProjectRenderer: any }>()
  return {
    ...actual,
    MultiGeneratorRenderer: mockMultiGenRenderer,
    MultiProjectRenderer: mockMultiProjRenderer,
  }
})

/** Reset all mock call history and re-apply factory implementations. */
function resetMocks() {
  vi.clearAllMocks()
  // Re-apply default implementations
  vi.mocked(readConfig).mockImplementation(() => Promise.resolve(generatingConfig) as any)
  vi.mocked(resolveWorkspaces).mockImplementation(() => Promise.resolve(['./packages/test-pkg-1', './packages/test-pkg-2']) as any)
  mockMultiGenRenderer.mockImplementation(() => ({
    setActive: vi.fn(),
    setProgress: vi.fn(),
    setDone: vi.fn(),
    setFailed: vi.fn(),
    setSkipped: vi.fn(),
    finalize: vi.fn(),
  }))
  mockMultiProjRenderer.mockImplementation(() => ({
    onProjectEvent: vi.fn(),
    finalize: vi.fn(),
  }))
}

describe('cli', () => {
  it('should get the right `init` cli args', async () => {
    await actionInit({ type: 'commonjs' })
    // template defaults to 'alova' when not specified (non-TTY)
    expect(createConfig).toBeCalledWith({ type: 'commonjs', template: 'alova', projectPath: expect.any(String) })

    await actionInit({ project: '/mock_path' })
    // type is auto-detected, template defaults to 'alova'
    expect(createConfig).toBeCalledWith({ type: expect.any(String), template: 'alova', projectPath: '/mock_path' })

    await actionInit({ template: 'axios' })
    expect(createConfig).toBeCalledWith({ type: expect.any(String), template: 'axios', projectPath: expect.any(String) })

    await actionInit({ type: 'typescript', template: 'fetch', project: '/mock_path' })
    expect(createConfig).toBeCalledWith({ type: 'typescript', template: 'fetch', projectPath: '/mock_path' })
  })

  it('should use MultiProjectRenderer in workspace mode (≥2 projects)', async () => {
    resetMocks()
    await actionGen({})

    expect(resolveWorkspaces).toHaveBeenCalledTimes(1)
    expect(resolveWorkspaces).toHaveBeenCalledWith()
    expect(readConfig).toHaveBeenCalledTimes(2)
    expect(readConfig).toHaveBeenNthCalledWith(1, './packages/test-pkg-1')
    expect(readConfig).toHaveBeenNthCalledWith(2, './packages/test-pkg-2')

    // With 2 projects → MultiProjectRenderer (not MultiGeneratorRenderer)
    expect(mockMultiProjRenderer).toHaveBeenCalledTimes(1)
    expect(mockMultiGenRenderer).not.toHaveBeenCalled()

    // generate() is called once per project
    expect(mockGenerate).toHaveBeenCalledTimes(2)
    expect(mockGenerate).toHaveBeenNthCalledWith(1, generatingConfig, expect.objectContaining({
      force: undefined,
      projectPath: './packages/test-pkg-1',
      onProgress: expect.any(Function),
    }))
    expect(mockGenerate).toHaveBeenNthCalledWith(2, generatingConfig, expect.objectContaining({
      force: undefined,
      projectPath: './packages/test-pkg-2',
      onProgress: expect.any(Function),
    }))
  })

  it('should route progress events per project in multi-project mode', async () => {
    resetMocks()
    await actionGen({})

    const rendererInstance = mockMultiProjRenderer.mock.results[0].value

    // Each generate call receives an onProgress callback
    const onProgress0 = mockGenerate.mock.calls[0][1].onProgress
    const onProgress1 = mockGenerate.mock.calls[1][1].onProgress

    // Simulate events: project 0 generator 0 → active
    onProgress0({ index: 0, phase: 'active' })
    expect(rendererInstance.onProjectEvent).toHaveBeenCalledWith(0, { index: 0, phase: 'active' })

    // Simulate events: project 1 generator 0 → active
    onProgress1({ index: 0, phase: 'active' })
    expect(rendererInstance.onProjectEvent).toHaveBeenCalledWith(1, { index: 0, phase: 'active' })

    // Simulate progress
    onProgress0({ index: 0, phase: 'progress', progress: 50, message: 'parsing' })
    expect(rendererInstance.onProjectEvent).toHaveBeenCalledWith(0, {
      index: 0,
      phase: 'progress',
      progress: 50,
      message: 'parsing',
    })

    // Simulate done
    onProgress0({ index: 0, phase: 'done' })
    expect(rendererInstance.onProjectEvent).toHaveBeenCalledWith(0, { index: 0, phase: 'done' })

    // finalize is called with all results
    expect(rendererInstance.finalize).toHaveBeenCalledWith([[true], [true]])
  })

  it('should delegate to generate() in single project mode (-p)', async () => {
    resetMocks()
    await actionGen({ project: '/mock_path', force: true })

    expect(resolveWorkspaces).not.toHaveBeenCalled()
    expect(readConfig).toHaveBeenCalledTimes(1)
    expect(readConfig).toHaveBeenNthCalledWith(1, '/mock_path')

    // Single project → MultiGeneratorRenderer (not MultiProjectRenderer)
    expect(mockMultiGenRenderer).toHaveBeenCalledTimes(1)
    expect(mockMultiProjRenderer).not.toHaveBeenCalled()

    expect(mockGenerate).toHaveBeenCalledTimes(1)
    expect(mockGenerate).toHaveBeenNthCalledWith(1, generatingConfig, expect.objectContaining({
      force: true,
      projectPath: '/mock_path',
      onProgress: expect.any(Function),
    }))
  })

  it('should use single-project renderer when workspace has only one project', async () => {
    resetMocks()
    vi.mocked(resolveWorkspaces).mockReturnValueOnce(Promise.resolve(['./packages/test-pkg-1']) as any)

    await actionGen({})

    // Only 1 project → MultiGeneratorRenderer
    expect(mockMultiGenRenderer).toHaveBeenCalledTimes(1)
    expect(mockMultiProjRenderer).not.toHaveBeenCalled()
    expect(mockGenerate).toHaveBeenCalledTimes(1)
  })

  it('should handle the three-project case correctly', async () => {
    resetMocks()
    vi.mocked(resolveWorkspaces).mockReturnValueOnce(Promise.resolve([
      './packages/test-pkg-1',
      './packages/test-pkg-2',
      './packages/test-pkg-3',
    ]) as any)

    await actionGen({})

    expect(mockMultiProjRenderer).toHaveBeenCalledTimes(1)
    expect(mockMultiGenRenderer).not.toHaveBeenCalled()
    expect(readConfig).toHaveBeenCalledTimes(3)
    expect(mockGenerate).toHaveBeenCalledTimes(3)
  })

  it('should skip projects with no generators configured', async () => {
    resetMocks()

    // 3 workspace dirs, but the second has no generators
    vi.mocked(readConfig)
      .mockReturnValueOnce(Promise.resolve(generatingConfig) as any)
      .mockReturnValueOnce(Promise.resolve({ generator: [] }) as any)
      .mockReturnValueOnce(Promise.resolve(generatingConfig) as any)
    vi.mocked(resolveWorkspaces).mockReturnValueOnce(Promise.resolve([
      './packages/test-pkg-1',
      './packages/test-pkg-2',
      './packages/test-pkg-3',
    ]) as any)

    await actionGen({})

    // 3 dirs but only 2 have generators → still multi-project (2 projects)
    expect(mockMultiProjRenderer).toHaveBeenCalledTimes(1)
    expect(mockMultiGenRenderer).not.toHaveBeenCalled()
    expect(mockGenerate).toHaveBeenCalledTimes(2)
  })
})
