/* eslint-disable ts/no-require-imports */
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { aiDoc } from '@/plugins/presets/aiDoc'
import { alovaGlobals } from '@/plugins'
import { generateWithPlugin } from '../util'

// Hoisted: create the shared memfs volume before any module imports
const { testVol } = vi.hoisted(() => {
  const { Volume } = require('memfs')
  return { testVol: new Volume() }
})

vi.mock('node:fs', async () => {
  const { createFsFromVolume } = await import('memfs')
  const memFs = createFsFromVolume(testVol)
  return { default: memFs, ...memFs }
})

vi.mock('node:fs/promises', async () => {
  const { createFsFromVolume } = await import('memfs')
  const memFs = createFsFromVolume(testVol)
  return { default: memFs.promises, ...memFs.promises }
})

// Helper to read from the memfs volume used by the mocked fs
function readVolFile(...args: Parameters<typeof testVol.readFileSync>) {
  return testVol.readFileSync(...args) as string
}

describe('plugins/aiDoc', () => {
  // Copy all real template preset directories into the memfs volume before tests
  beforeAll(async () => {
    const realFs = await vi.importActual<typeof import('node:fs')>('node:fs')
    const realPath
      = await vi.importActual<typeof import('node:path')>('node:path')

    function copyDir(src: string, dest: string) {
      if (!realFs.existsSync(src))
        return
      testVol.mkdirSync(dest, { recursive: true })
      for (const entry of realFs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = realPath.join(src, entry.name)
        const destPath = `${dest}/${entry.name}`
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath)
        }
        else {
          testVol.writeFileSync(destPath, realFs.readFileSync(srcPath))
        }
      }
    }

    // getPresetTemplatePath uses path.join(__dirname, 'presets', presetName)
    // where __dirname is src/template/, so the presets base is src/template/presets/
    const templateBase = realPath.resolve(
      realPath.join(__dirname, '../..'),
      'src/template/presets',
    )
    copyDir(templateBase, templateBase)
  })

  describe('unit tests', () => {
    it('should return a plugin with correct name', () => {
      const plugin = aiDoc()
      expect(plugin.name).toBe('aiDoc')
    })

    it('should have config and codeGenerated hooks', () => {
      const plugin = aiDoc()
      expect(plugin.config).toBeTypeOf('function')
      expect(plugin.codeGenerated).toBeTypeOf('function')
    })

    it('config hook should capture output and serverName', () => {
      const plugin = aiDoc()
      const cfg: any = {
        output: './src/api',
        serverName: 'TestServer',
      }
      const result = plugin.config?.({
        config: cfg,
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })
      expect(result).toBe(cfg)
    })

    it('config hook should return config unchanged', () => {
      const plugin = aiDoc()
      const cfg: any = {
        output: './api',
        serverName: 'My API',
        plugins: [],
      }
      const returned = plugin.config?.({
        config: cfg,
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })
      expect(returned).toEqual(cfg)
    })

    it('codeGenerated should do nothing on error', async () => {
      const plugin = aiDoc({ install: false })
      plugin.config?.({
        config: {
          output: 'src/api',
        } as any,
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })
      await plugin.codeGenerated?.({
        config: {} as any,
        data: {} as any,
        filePaths: [],
        outputDir: process.cwd(),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
        error: new Error('generation failed'),
      })
    })

    it('codeGenerated should do nothing if no template data', async () => {
      const plugin = aiDoc({ install: false })
      plugin.config?.({
        config: {
          output: './nonexistent',
        } as any,
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })
      // Pass undefined data -> plugin should return early
      await plugin.codeGenerated?.({
        config: {} as any,
        data: undefined as any,
        filePaths: [],
        outputDir: process.cwd(),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })
    })

    it('codeGenerated should generate SKILL.md and reference files via template engine', async () => {
      const plugin = aiDoc({ install: false })
      const outputPath = 'src/api'
      const cfg: any = {
        output: outputPath,
        serverName: 'PetStore',
      }
      plugin.config?.({ config: cfg, projectPath: process.cwd(), reportProgress: vi.fn() })

      const apiListPets = {
        tag: 'pets',
        method: 'GET',
        summary: 'List all pets',
        path: '/pets',
        name: 'listPets',
        response: 'Pet[]',
        pathKey: 'pets.listPets',
        pathParameters: '',
        queryParameters: 'params?: { limit?: number }',
        queryParametersComment: '// limit: number of items',
        responseComment: '// returns Pet[]',
        defaultValue: '',
      }
      const apiCreatePet = {
        tag: 'pets',
        method: 'POST',
        summary: 'Create a pet',
        path: '/pets',
        name: 'createPet',
        response: 'Pet',
        requestBody: 'CreatePetRequest',
        pathKey: 'pets.createPet',
        pathParameters: '',
        queryParameters: '',
        requestBodyComment: '// body: CreatePetRequest',
        responseComment: '// returns Pet',
        defaultValue: '',
      }
      const data: any = {
        title: 'Pet Store API',
        version: '1.0.0',
        openapi: '3.0.1',
        description: 'A pet store API',
        baseUrl: '/api',
        allApis: [apiListPets, apiCreatePet],
        components: [],
        componentNames: [],
        type: 'typescript' as const,
        config: {},
        tagedApis: [
          {
            tagName: 'pets',
            apis: [apiListPets, apiCreatePet],
          },
        ],
      }

      await plugin.codeGenerated?.({
        config: {} as any,
        data,
        filePaths: [],
        outputDir: resolve(process.cwd(), outputPath),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })

      const aidocsDir = resolve(process.cwd(), outputPath, 'aidocs')

      // SKILL.md should be generated with template engine
      const skillContent = readVolFile(resolve(aidocsDir, 'SKILL.md'), 'utf-8')
      expect(skillContent).toContain('PetStore')
      expect(skillContent).toContain('Pet Store API')
      expect(skillContent).toContain('1.0.0')
      expect(skillContent).toContain('List all pets')
      expect(skillContent).toContain('Create a pet')
      expect(skillContent).toContain('[GET]')
      expect(skillContent).toContain('[POST]')
      // SKILL.md lists APIs grouped by tag with indentation
      expect(skillContent).toContain('**pets**')
      expect(skillContent).toContain('./references/pets/listPets.md')
      expect(skillContent).toContain('./references/pets/createPet.md')

      // Reference files per API: references/pets/listPets.md (generated via {tag}/{api}.md.handlebars)
      const listPetsContent = readVolFile(
        resolve(aidocsDir, 'references', 'pets', 'listPets.md'),
        'utf-8',
      )
      expect(listPetsContent).toContain('List all pets')
      expect(listPetsContent).toContain('[GET]')
      expect(listPetsContent).toContain('/pets')
      // Should show file location, not import statement
      expect(listPetsContent).toContain('is located at')

      const createPetContent = readVolFile(
        resolve(aidocsDir, 'references', 'pets', 'createPet.md'),
        'utf-8',
      )
      expect(createPetContent).toContain('Create a pet')
      expect(createPetContent).toContain('[POST]')
    })

    it('should respect custom outputDir option', async () => {
      const plugin = aiDoc({ outputDir: 'custom-docs', install: false })
      const outputPath = 'src/api2'
      const cfg: any = {
        output: outputPath,
        serverName: 'Test',
      }
      plugin.config?.({ config: cfg, projectPath: process.cwd(), reportProgress: vi.fn() })

      const apiTest = {
        tag: 'test',
        method: 'GET',
        summary: 'Test',
        path: '/test',
        name: 'testApi',
        response: 'void',
        pathKey: 'test.testApi',
        pathParameters: '',
        queryParameters: '',
        defaultValue: '',
      }
      const data: any = {
        title: 'Test',
        version: '1.0.0',
        openapi: '3.0.1',
        baseUrl: '/api',
        allApis: [apiTest],
        components: [],
        componentNames: [],
        type: 'typescript',
        config: {},
        tagedApis: [
          {
            tagName: 'test',
            apis: [apiTest],
          },
        ],
      }

      await plugin.codeGenerated?.({
        config: {} as any,
        data,
        filePaths: [],
        outputDir: resolve(process.cwd(), outputPath),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })

      const customDir = resolve(process.cwd(), outputPath, 'custom-docs')
      const skillContent = readVolFile(resolve(customDir, 'SKILL.md'), 'utf-8')
      expect(skillContent).toContain('Test')
    })

    it('should use title as serverName when serverName not provided', async () => {
      const plugin = aiDoc({ install: false })
      const outputPath = 'src/api3'
      const cfg: any = {
        output: outputPath,
      }
      plugin.config?.({ config: cfg, projectPath: process.cwd(), reportProgress: vi.fn() })

      const apiHello = {
        tag: 'default',
        method: 'GET',
        summary: 'Hello',
        path: '/hello',
        name: 'hello',
        response: 'string',
        pathKey: 'default.hello',
        pathParameters: '',
        queryParameters: '',
        defaultValue: '',
      }
      const data: any = {
        title: 'Fallback Title',
        version: '1.0.0',
        openapi: '3.0.1',
        baseUrl: '/api',
        allApis: [apiHello],
        components: [],
        componentNames: [],
        type: 'typescript',
        config: {},
        tagedApis: [
          {
            tagName: 'default',
            apis: [apiHello],
          },
        ],
      }

      await plugin.codeGenerated?.({
        config: {} as any,
        data,
        filePaths: [],
        outputDir: resolve(process.cwd(), outputPath),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })

      const aidocsDir = resolve(process.cwd(), outputPath, 'aidocs')
      const skillContent = readVolFile(resolve(aidocsDir, 'SKILL.md'), 'utf-8')
      expect(skillContent).toContain('Fallback Title')
    })

    it('should show file location in reference docs', async () => {
      const plugin = aiDoc({ install: false })
      const outputPath = 'src/api4'
      const cfg: any = {
        output: outputPath,
        serverName: 'FileLocTest',
      }
      plugin.config?.({ config: cfg, projectPath: process.cwd(), reportProgress: vi.fn() })

      const apiGetUser = {
        tag: 'users',
        method: 'GET',
        summary: 'Get user',
        path: '/users/{id}',
        name: 'getUser',
        response: 'User',
        pathKey: 'users.getUser',
        pathParameters: 'id: string',
        pathParametersComment: '// id: user ID',
        queryParameters: '',
        defaultValue: '',
      }
      const data: any = {
        title: 'File Location Test',
        version: '1.0.0',
        openapi: '3.0.1',
        baseUrl: '/api',
        allApis: [apiGetUser],
        components: [],
        componentNames: [],
        type: 'typescript',
        config: {},
        tagedApis: [
          {
            tagName: 'users',
            apis: [apiGetUser],
          },
        ],
      }

      await plugin.codeGenerated?.({
        config: {} as any,
        data,
        filePaths: [],
        outputDir: resolve(process.cwd(), outputPath),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
      })

      const aidocsDir = resolve(process.cwd(), outputPath, 'aidocs')
      const refContent = readVolFile(
        resolve(aidocsDir, 'references', 'users', 'getUser.md'),
        'utf-8',
      )
      // Should show file location instead of import statement
      expect(refContent).toContain('is located at')
      expect(refContent).not.toContain('import { getUser }')
      expect(refContent).toContain('Path Parameters')
      expect(refContent).toContain('id: user ID')
    })
  })

  describe('integration tests', () => {
    it('should not break generation when used as a plugin', async () => {
      const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [aiDoc({ install: false })],
      )

      expect(apiDefinitionsFile).not.toBeUndefined()
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should work alongside other plugins', async () => {
      const { importType } = await import('@/plugins/presets/importType')
      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [aiDoc({ install: false }), importType({ '@/models': ['User'] })],
      )

      expect(globalsFile).toMatch('declare global')
    })
  })
})
