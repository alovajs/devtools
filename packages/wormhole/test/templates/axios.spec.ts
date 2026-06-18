import { resolve } from 'node:path'
import { vol } from 'memfs'
import { generate } from '@/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('axios template (per-tag, tree-shaking)', () => {
  it('should generate per-tag files with named exports', async () => {
    const outputDir = resolve(__dirname, `../mock_output/axios_basic`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).axios()],
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

  it('should generate axiosInstance in index.ts', async () => {
    const outputDir = resolve(__dirname, `../mock_output/axios_instance`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).axios()],
          type: 'ts',
        },
      ],
    })

    const content = vol.readFileSync(resolve(outputDir, 'index.ts'), 'utf-8') as string
    expect(content).toContain('axiosInstance')
    expect(content).toContain('axios')
  })

  it('should import axiosInstance in tag files', async () => {
    const outputDir = resolve(__dirname, `../mock_output/axios_tag`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).axios()],
          type: 'ts',
        },
      ],
    })

    const servicesDir = resolve(outputDir, 'services')
    const serviceFiles = vol.readdirSync(servicesDir) as string[]
    const tagFile = serviceFiles.find(f => f.endsWith('.ts') && f !== 'index.ts')
    expect(tagFile).toBeDefined()
    const content = vol.readFileSync(resolve(servicesDir, tagFile!), 'utf-8') as string
    expect(content).toContain('axiosInstance')
    expect(content).toMatch(/export\s+function\s+\w+/)
  })
})
