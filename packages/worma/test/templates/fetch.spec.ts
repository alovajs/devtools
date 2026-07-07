import { resolve } from 'node:path'
import { vol } from 'memfs'
import { generate } from '@/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('fetch template (per-tag, tree-shaking)', () => {
  it('should generate per-tag files with named exports', async () => {
    const outputDir = resolve(__dirname, `../mock_output/fetch_basic`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).fetch()],
          type: 'ts',
        },
      ],
    })

    const files = vol.readdirSync(outputDir) as string[]
    expect(files).toContain('index.ts')
    expect(files).not.toContain('createApis.ts')
    const servicesDir = resolve(outputDir, 'services')
    const serviceFiles = vol.readdirSync(servicesDir) as string[]
    const tagFiles = serviceFiles.filter(f => f.endsWith('.ts') && f !== 'index.ts')
    expect(tagFiles.length).toBeGreaterThan(0)
  })

  it('should export fetchClient in index.ts', async () => {
    const outputDir = resolve(__dirname, `../mock_output/fetch_baseurl`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).fetch()],
          type: 'ts',
        },
      ],
    })

    const content = vol.readFileSync(resolve(outputDir, 'index.ts'), 'utf-8') as string
    expect(content).toContain('fetchClient')
    expect(content).toContain('FetchClient')
  })

  it('should use fetchClient in tag files', async () => {
    const outputDir = resolve(__dirname, `../mock_output/fetch_native`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).fetch()],
          type: 'ts',
        },
      ],
    })

    const servicesDir = resolve(outputDir, 'services')
    const serviceFiles = vol.readdirSync(servicesDir) as string[]
    const tagFile = serviceFiles.find(f => f.endsWith('.ts') && f !== 'index.ts')
    expect(tagFile).toBeDefined()
    const content = vol.readFileSync(resolve(servicesDir, tagFile!), 'utf-8') as string
    expect(content).toContain('fetchClient')
    expect(content).toMatch(/export\s+async\s+function\s+\w+/)
  })
})
