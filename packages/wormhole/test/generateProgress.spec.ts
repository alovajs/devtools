import type { GenerateProgress } from '@/type/lib'
import { resolve } from 'node:path'
import { vol } from 'memfs'
import { generate } from '@/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('generate() progress reporting', () => {
  it('reports core lifecycle progress to onProgress and reaches 100', async () => {
    const outputDir = resolve(__dirname, './mock_output/progress_core')
    vol.mkdirSync(outputDir, { recursive: true })
    const snapshots: Record<string, GenerateProgress>[] = []
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
        progressInterval: 0, // emit on every update for deterministic capture
        onProgress: (snap) => {
          snapshots.push(snap)
        },
      },
    )
    expect(snapshots.length).toBeGreaterThan(0)
    const last = snapshots[snapshots.length - 1]
    expect(last.core).toBeDefined()
    expect(last.core.progress).toBe(100)
    // sanity: progress is monotonically non-decreasing for the core source
    const coreProgressSeries = snapshots
      .map(s => s.core?.progress)
      .filter((p): p is number => typeof p === 'number')
    for (let i = 1; i < coreProgressSeries.length; i++) {
      expect(coreProgressSeries[i]).toBeGreaterThanOrEqual(coreProgressSeries[i - 1])
    }
  })

  it('captures progress reported by plugins under their plugin name', async () => {
    const outputDir = resolve(__dirname, './mock_output/progress_plugin')
    vol.mkdirSync(outputDir, { recursive: true })
    const snapshots: Record<string, GenerateProgress>[] = []
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
        progressInterval: 0,
        onProgress: (snap) => {
          snapshots.push(snap)
        },
      },
    )
    const last = snapshots[snapshots.length - 1]
    expect(last['my-plugin']).toBeDefined()
    expect(last['my-plugin'].progress).toBe(100)
    expect(last['my-plugin'].message).toBe('finalised')
    const messages = snapshots
      .map(s => s['my-plugin']?.message)
      .filter(Boolean)
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
