import type { GeneratorProgressEvent } from '@/type/lib'
import { resolve } from 'node:path'
import { vol } from 'memfs'
import { generate } from '@/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('generate() progress reporting', () => {
  it('reports core lifecycle progress via GeneratorProgressEvent and reaches done', async () => {
    const outputDir = resolve(__dirname, './mock_output/progress_core')
    vol.mkdirSync(outputDir, { recursive: true })
    const events: GeneratorProgressEvent[] = []
    await generate(
      {
        generator: [
          {
            input: resolve(__dirname, './openapis/openapi_300.yaml'),
            output: outputDir,
            plugins: [(await import('@/plugins')).alova()],
            type: 'ts',
          },
        ],
      },
      {
        force: true,
        onProgress: (e) => {
          events.push({ ...e })
        },
      },
    )
    expect(events.length).toBeGreaterThan(0)

    // Verify 'active' event comes first
    expect(events[0].phase).toBe('active')

    // Verify 'progress' events are monotonically non-decreasing
    const coreProgressSeries = events
      .filter(e => e.phase === 'progress' && e.source === 'core')
      .map(p => (p as { progress: number }).progress)
    expect(coreProgressSeries.length).toBeGreaterThan(0)
    for (let i = 1; i < coreProgressSeries.length; i++) {
      expect(coreProgressSeries[i]).toBeGreaterThanOrEqual(coreProgressSeries[i - 1])
    }

    // Verify terminal event is 'done'
    const terminalEvents = events.filter(e => e.phase === 'done' || e.phase === 'failed' || e.phase === 'skipped')
    expect(terminalEvents.length).toBeGreaterThanOrEqual(1)
    expect(terminalEvents[0].phase).toBe('done')
  })

  it('captures progress reported by plugins under their plugin name', async () => {
    const outputDir = resolve(__dirname, './mock_output/progress_plugin')
    vol.mkdirSync(outputDir, { recursive: true })
    const events: GeneratorProgressEvent[] = []
    await generate(
      {
        generator: [
          {
            input: resolve(__dirname, './openapis/openapi_300.yaml'),
            output: outputDir,
            type: 'ts',
            plugins: [(await import('@/plugins')).alova(),
              {
                name: 'my-plugin',
                openapiParsed({ reportProgress }) {
                  reportProgress(50, 'merging schemas')
                },
                codeGenerated({ reportProgress }) {
                  reportProgress(100, 'finalised')
                },
              },
            ],
          },
        ],
      },
      {
        force: true,
        onProgress: (e) => {
          events.push({ ...e })
        },
      },
    )

    // Find plugin progress events
    const pluginEvents = events.filter(
      e => e.phase === 'progress' && e.source === 'my-plugin',
    ) as Array<{ progress: number; message: string }>
    expect(pluginEvents.length).toBeGreaterThan(0)

    // Verify plugin reported progress=100 with message 'finalised'
    const lastPluginEvent = pluginEvents[pluginEvents.length - 1]
    expect(lastPluginEvent.progress).toBe(100)
    expect(lastPluginEvent.message).toBe('finalised')

    const messages = pluginEvents.map(e => e.message)
    expect(messages).toContain('merging schemas')
  })

  it('runs without errors when onProgress is not provided', async () => {
    const outputDir = resolve(__dirname, './mock_output/progress_none')
    vol.mkdirSync(outputDir, { recursive: true })
    await expect(generate(
      {
        generator: [
          {
            input: resolve(__dirname, './openapis/openapi_300.yaml'),
            output: outputDir,
            plugins: [(await import('@/plugins')).alova()],
            type: 'ts',
          },
        ],
      },
      { force: true },
    )).resolves.toBeDefined()
  })
})
