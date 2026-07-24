import { resolve } from 'node:path'
import { vol } from 'memfs'
import { generate } from '@/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('ky template (per-tag, tree-shaking)', () => {
  it('should generate per-tag files with named exports', async () => {
    const outputDir = resolve(__dirname, `../mock_output/ky_basic`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).ky()],
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
    const content = vol.readFileSync(resolve(servicesDir, 'index.ts'), 'utf-8') as string
    expect(content).toMatch(/import type \* as \w+ from/)
    expect(content).not.toMatch(/^import \* as /m)
    expect(content).toMatch(/DefaultConfig: MethodDefaultConfig<typeof \w+> = \{\}/)
    expect(content).not.toContain('satisfies')
    expect(content).not.toContain('setDefaultConfig')
  })

  it('should export kyInstance in index.ts', async () => {
    const outputDir = resolve(__dirname, `../mock_output/ky_instance`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).ky()],
          type: 'ts',
        },
      ],
    })

    const content = vol.readFileSync(resolve(outputDir, 'index.ts'), 'utf-8') as string
    expect(content).toContain('kyInstance')
    expect(content).toContain('ky')
  })

  it('should use kyInstance in tag files and call .json() or .blob()', async () => {
    const outputDir = resolve(__dirname, `../mock_output/ky_tag`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [(await import('@/template')).ky()],
          type: 'ts',
        },
      ],
    })

    const servicesDir = resolve(outputDir, 'services')
    const serviceFiles = vol.readdirSync(servicesDir) as string[]
    const tagFile = serviceFiles.find(f => f.endsWith('.ts') && f !== 'index.ts')
    expect(tagFile).toBeDefined()
    const content = vol.readFileSync(resolve(servicesDir, tagFile!), 'utf-8') as string
    expect(content).toContain('kyInstance')
    expect(content).toMatch(/\.json<|\.blob\(\)/)
    expect(content).toMatch(/export\s+function\s+\w+/)
  })
})
