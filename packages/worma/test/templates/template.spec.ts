import { resolve } from 'node:path'
import { TemplateHelper } from '@/helper/template'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const FIXTURES_DIR = resolve(__dirname, '__fixtures__/presets')

function makeData(overrides: any = {}) {
  return {
    title: 'Test API',
    version: '1.0.0',
    openapi: '3.0.1',
    baseUrl: '/api',
    apis: [],
    components: [],
    type: 'typescript' as const,
    config: {},
    tagedApis: [
      {
        tagName: 'pets',
        apis: [
          {
            tag: 'pets',
            method: 'GET',
            summary: 'List pets',
            path: '/pets',
            name: 'listPets',
            responseName: 'Pet[]',
            pathKey: 'pets.listPets',
            pathParameters: '',
            queryParameters: '',
            callingCode: '',
          },
        ],
      },
      {
        tagName: 'users',
        apis: [
          {
            tag: 'users',
            method: 'POST',
            summary: 'Create user',
            path: '/users',
            name: 'createUser',
            responseName: 'User',
            pathKey: 'users.createUser',
            pathParameters: '',
            queryParameters: '',
            callingCode: '',
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('templateHelper rendering', () => {
  describe('module type subdirectory selection', () => {
    it('should pick typescript subdirectory when type is typescript', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      const result = await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output',
        makeData() as any,
      )

      // 9.2.1: generateFromTemplateDir returns { filePaths }
      expect(result.filePaths.length).toBeGreaterThan(0)
      // Tag templates expanded
      expect(result.filePaths.some(p => p.includes('pets.ts'))).toBe(true)
      expect(result.filePaths.some(p => p.includes('users.ts'))).toBe(true)
    })
  })

  describe('flat template directory (no module type subdirs)', () => {
    it('should use root template files when no module type subdirs exist', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-flat'),
      })

      const result = await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-flat'),
        '/output',
        makeData() as any,
      )

      expect(result.filePaths.length).toBeGreaterThan(0)
    })
  })

  describe('template data rendering', () => {
    it('should render title, version, baseUrl from TemplateData', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output',
        makeData({ title: 'My Wonderful API', version: '2.5.0', baseUrl: 'https://example.com' }) as any,
      )

      // Read the written file to verify content
      const { vol } = await import('memfs')
      const indexPath = '/output/index.ts'
      const content = vol.readFileSync(indexPath, 'utf-8') as string
      expect(content).toContain('My Wonderful API')
      expect(content).toContain('2.5.0')
      expect(content).toContain('https://example.com')
    })

    it('should render config values both via {{config.x}} and via top-level shorthand', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      const data = makeData({
        config: { customField: 'config-value', framework: 'vue' },
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output',
        data as any,
      )

      const { vol } = await import('memfs')
      const content = vol.readFileSync('/output/index.ts', 'utf-8') as string
      expect(content).toContain('Framework: vue')
      expect(content).toContain('config-value')
    })
  })

  describe('{tag} expansion', () => {
    it('should generate one file per tag with the tag name substituted', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output',
        makeData() as any,
      )

      const { vol } = await import('memfs')
      const petsContent = vol.readFileSync('/output/pets.ts', 'utf-8') as string
      const usersContent = vol.readFileSync('/output/users.ts', 'utf-8') as string

      expect(petsContent).toBeDefined()
      expect(usersContent).toBeDefined()

      // Each file should contain only its own tag's APIs
      expect(petsContent).toContain('listPets')
      expect(petsContent).not.toContain('createUser')
      expect(usersContent).toContain('createUser')
      expect(usersContent).not.toContain('listPets')
    })
  })

  describe('partials registration', () => {
    it('should register and use partials from partials/ directory', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output',
        makeData({ title: 'Partial Test', config: { customField: 'from-config' } }) as any,
      )

      const { vol } = await import('memfs')
      const content = vol.readFileSync('/output/index.ts', 'utf-8') as string
      expect(content).toContain('Header partial')
      expect(content).toContain('Partial Test')
      expect(content).toContain('from-config')
    })
  })

  describe('nested directory structure', () => {
    it('should preserve nested directory paths in output', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      const result = await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output',
        makeData() as any,
      )

      // Nested file should preserve its directory structure
      const nestedPath = result.filePaths.find(p => p.includes('value.ts'))
      expect(nestedPath).toBeDefined()
      expect(nestedPath).toMatch(/nested[/\\]deep[/\\]value\.ts/)

      const { vol } = await import('memfs')
      const content = vol.readFileSync(nestedPath!, 'utf-8') as string
      expect(content).toContain('Test API')
    })
  })

  describe('# no-overwrite prefix', () => {
    it('should generate # files without the # prefix in output filenames', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      const result = await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        '/output-noexist',
        makeData() as any,
      )

      // The # should be stripped from output keys
      expect(result.filePaths.some(p => p.includes('#'))).toBe(false)
      const { vol } = await import('memfs')
      const content = vol.readFileSync('/output-noexist/user.ts', 'utf-8') as string
      expect(content).toBeDefined()
      expect(content).toContain('do-not-overwrite')
    })
  })

  describe('unsupported module type', () => {
    it('should throw an error listing supported types when requesting an unsupported module type', async () => {
      const helper = TemplateHelper.load({
        type: 'commonjs',
        templatePath: resolve(FIXTURES_DIR, 'ts-module-only'),
      })

      await expect(
        helper.generateFromTemplateDir(
          resolve(FIXTURES_DIR, 'ts-module-only'),
          '/output',
          makeData({ type: 'commonjs' }) as any,
        ),
      ).rejects.toThrow(/does not support module type "commonjs"/)
    })

    it('should include the supported types in the error message', async () => {
      const helper = TemplateHelper.load({
        type: 'commonjs',
        templatePath: resolve(FIXTURES_DIR, 'ts-module-only'),
      })

      await expect(
        helper.generateFromTemplateDir(
          resolve(FIXTURES_DIR, 'ts-module-only'),
          '/output',
          makeData({ type: 'commonjs' }) as any,
        ),
      ).rejects.toThrow(/typescript.*module|module.*typescript/)
    })

    it('should succeed when requesting a supported module type', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'ts-module-only'),
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'ts-module-only'),
        '/output',
        makeData() as any,
      )

      const { vol } = await import('memfs')
      const content = vol.readFileSync('/output/index.ts', 'utf-8') as string
      expect(content).toBeDefined()
    })
  })

  describe('{tag} directory', () => {
    it('should generate one directory per tag and expand {api} files inside using tag-scoped APIs', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-tagdir'),
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-tagdir'),
        '/output',
        makeData() as any,
      )

      const { vol } = await import('memfs')

      // Per-tag directory with per-api files
      const petsDoc = vol.readFileSync('/output/references/pets/tag-doc.md', 'utf-8') as string
      const usersDoc = vol.readFileSync('/output/references/users/tag-doc.md', 'utf-8') as string
      expect(petsDoc).toBeDefined()
      expect(usersDoc).toBeDefined()

      // {api} file inside {tag} dir should generate one per API within that tag
      const petsApi = vol.readFileSync('/output/references/pets/listPets.md', 'utf-8') as string
      expect(petsApi).toContain('listPets')
      expect(petsApi).not.toContain('createUser')
      const usersApi = vol.readFileSync('/output/references/users/createUser.md', 'utf-8') as string
      expect(usersApi).toContain('createUser')
      expect(usersApi).not.toContain('listPets')
    })

    it('regular (non-api) file inside {tag} dir should render once per tag with scoped data', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-tagdir'),
      })

      await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-tagdir'),
        '/output',
        makeData() as any,
      )

      const { vol } = await import('memfs')
      const petsDoc = vol.readFileSync('/output/references/pets/tag-doc.md', 'utf-8') as string
      expect(petsDoc).toContain('pets Documentation')
      expect(petsDoc).toContain('listPets')
      expect(petsDoc).not.toContain('createUser')
      const usersDoc = vol.readFileSync('/output/references/users/tag-doc.md', 'utf-8') as string
      expect(usersDoc).toContain('users Documentation')
      expect(usersDoc).toContain('createUser')
    })

    it('should throw error on nested {tag} directory', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-tagdir-nested'),
      })

      await expect(
        helper.generateFromTemplateDir(
          resolve(FIXTURES_DIR, 'custom-tagdir-nested'),
          '/output',
          makeData() as any,
        ),
      ).rejects.toThrow(/Nested \{tag\} directory is not allowed/)
    })

    it('should throw error on {tag} file inside {tag} directory', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-tagdir-nestedfile'),
      })

      await expect(
        helper.generateFromTemplateDir(
          resolve(FIXTURES_DIR, 'custom-tagdir-nestedfile'),
          '/output',
          makeData() as any,
        ),
      ).rejects.toThrow(/Nested \{tag\} template not allowed/)
    })
  })

  describe('file output (via generateFromTemplateDir)', () => {
    it('should write files to disk under specified output directory', async () => {
      const helper = TemplateHelper.load({
        type: 'typescript',
        templatePath: resolve(FIXTURES_DIR, 'custom-typed'),
      })

      const outputDir = '/test-output-write'
      const { vol } = await import('memfs')

      const result = await helper.generateFromTemplateDir(
        resolve(FIXTURES_DIR, 'custom-typed'),
        outputDir,
        makeData() as any,
      )

      // Files should be written to memfs
      expect(result.filePaths.length).toBeGreaterThan(0)
      const indexPath = '/test-output-write/index.ts'
      const content = vol.readFileSync(indexPath, 'utf-8') as string
      expect(content).toBeDefined()
      expect(content.length).toBeGreaterThan(0)
    })
  })
})
