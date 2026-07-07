import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { vol } from 'memfs'
import { generate } from '@/index'
import { alova } from '@/plugins'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('alova template', () => {
  it('should generate {tag} files instead of a single createApis file', async () => {
    const outputDir = resolve(__dirname, `../mock_output/functional_basic`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [alova()],
          type: 'ts',
        },
      ],
    })

    const files = vol.readdirSync(outputDir) as string[]
    expect(files).toContain('index.ts')
    expect(files).toContain('components.d.ts')
    expect(files).toContain('services')
    expect(files).not.toContain('createApis.ts')
    const serviceFiles = vol.readdirSync(resolve(outputDir, 'services')) as string[]
    const tagFiles = serviceFiles.filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts') && f !== 'index.ts')
    expect(tagFiles.length).toBeGreaterThan(0)
  })

  it('should use value import for alovaInstance (not import type)', async () => {
    const outputDir = resolve(__dirname, `../mock_output/functional_import`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [alova()],
          type: 'ts',
        },
      ],
    })

    const files = vol.readdirSync(outputDir) as string[]
    expect(files).toContain('services')
    const serviceFiles = vol.readdirSync(resolve(outputDir, 'services')) as string[]
    const FIXED_SERVICE_FILES = new Set(['index.ts'])
    const tagFile = serviceFiles.find(f => !FIXED_SERVICE_FILES.has(f) && f.endsWith('.ts') && !f.endsWith('.d.ts'))
    expect(tagFile).toBeDefined()
    const content = vol.readFileSync(resolve(outputDir, 'services', tagFile!), 'utf-8') as string
    expect(content).toMatch(/import\s*\{[^}]*alovaInstance[^}]*\}\s*from/)
    expect(content).not.toMatch(/import\s+type\s*\{[^}]*alovaInstance/)
  })

  it('should use {{#each components}} in types file (not {{#schemas}})', async () => {
    const outputDir = resolve(__dirname, `../mock_output/functional_types`)
    vol.mkdirSync(outputDir, { recursive: true })
    await generate({
      generator: [
        {
          input: resolve(__dirname, '../openapis/openapi_300.yaml'),
          output: outputDir,
          plugins: [alova()],
          type: 'ts',
        },
      ],
    })

    const content = vol.readFileSync(resolve(outputDir, 'components.d.ts'), 'utf-8') as string
    expect(content.trim().length).toBeGreaterThan(0)
  })

  describe('snapshot tests', () => {
    it('should match snapshot for typescript type', async () => {
      const outputDir = resolve(__dirname, '../mock_output/alova_snapshot_ts')
      vol.mkdirSync(outputDir, { recursive: true })
      await generate({
        generator: [
          {
            input: resolve(__dirname, '../openapis/openapi_300.yaml'),
            output: outputDir,
            plugins: [alova()],
            type: 'ts',
          },
        ],
      })

      expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'helper.ts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'typed.ts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'components.d.ts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'services/index.ts'), 'utf-8')).toMatchSnapshot()
      const serviceFiles = (vol.readdirSync(resolve(outputDir, 'services')) as string[]).sort()
      for (const f of serviceFiles.filter(f => f !== 'index.ts' && f.endsWith('.ts') && !f.endsWith('.d.ts'))) {
        expect(await fs.readFile(resolve(outputDir, 'services', f), 'utf-8')).toMatchSnapshot()
      }
    })

    it('should match snapshot for module type', async () => {
      const outputDir = resolve(__dirname, '../mock_output/alova_snapshot_mod')
      vol.mkdirSync(outputDir, { recursive: true })
      await generate({
        generator: [
          {
            input: resolve(__dirname, '../openapis/openapi_300.yaml'),
            output: outputDir,
            plugins: [alova()],
            type: 'module',
          },
        ],
      })

      expect(await fs.readFile(resolve(outputDir, 'index.js'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'helper.js'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'typed.d.ts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'components.d.ts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'services/index.js'), 'utf-8')).toMatchSnapshot()
      const serviceFiles = (vol.readdirSync(resolve(outputDir, 'services')) as string[]).sort()
      for (const f of serviceFiles.filter(f => f !== 'index.js' && f.endsWith('.js'))) {
        expect(await fs.readFile(resolve(outputDir, 'services', f), 'utf-8')).toMatchSnapshot()
      }
    })

    it('should match snapshot for commonjs type', async () => {
      const outputDir = resolve(__dirname, '../mock_output/alova_snapshot_cjs')
      vol.mkdirSync(outputDir, { recursive: true })
      await generate({
        generator: [
          {
            input: resolve(__dirname, '../openapis/openapi_300.yaml'),
            output: outputDir,
            plugins: [alova()],
            type: 'commonjs',
          },
        ],
      })

      expect(await fs.readFile(resolve(outputDir, 'index.cjs'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'helper.cjs'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'typed.d.cts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'components.d.cts'), 'utf-8')).toMatchSnapshot()
      expect(await fs.readFile(resolve(outputDir, 'services/index.cjs'), 'utf-8')).toMatchSnapshot()
      const serviceFiles = (vol.readdirSync(resolve(outputDir, 'services')) as string[]).sort()
      for (const f of serviceFiles.filter(f => f !== 'index.cjs' && f.endsWith('.cjs'))) {
        expect(await fs.readFile(resolve(outputDir, 'services', f), 'utf-8')).toMatchSnapshot()
      }
    })
  })
})
