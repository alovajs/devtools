/* eslint-disable ts/no-require-imports */
import type { RenderTemplateParams } from '@/helper/config/type'
import { resolve } from 'node:path'
import { logger } from '@/helper/logger'
import { TemplateHelper } from '@/helper/template'
import { aiDoc } from '@/plugins/presets/aiDoc'
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

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

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
    const renderTemplateFn = (params: RenderTemplateParams) => TemplateHelper.renderToDir(params)

    beforeEach(() => {
      vi.clearAllMocks()
    })

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
      const plugin = aiDoc()
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
        renderTemplate: renderTemplateFn,
        error: new Error('generation failed'),
      })
    })

    it('codeGenerated should do nothing if no template data', async () => {
      const plugin = aiDoc()
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
        renderTemplate: renderTemplateFn,
      })
    })

    it('codeGenerated should generate SKILL.md and reference files via template engine', async () => {
      const plugin = aiDoc()
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
        callingCode: '',
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
        callingCode: '',
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
        renderTemplate: renderTemplateFn,
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
      const plugin = aiDoc({ outputDir: 'custom-docs' })
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
        callingCode: '',
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
        renderTemplate: renderTemplateFn,
      })

      const customDir = resolve(process.cwd(), outputPath, 'custom-docs')
      const skillContent = readVolFile(resolve(customDir, 'SKILL.md'), 'utf-8')
      expect(skillContent).toContain('Test')
    })

    it('should use title as serverName when serverName not provided', async () => {
      const plugin = aiDoc()
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
        callingCode: '',
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
        renderTemplate: renderTemplateFn,
      })

      const aidocsDir = resolve(process.cwd(), outputPath, 'aidocs')
      const skillContent = readVolFile(resolve(aidocsDir, 'SKILL.md'), 'utf-8')
      expect(skillContent).toContain('Fallback Title')
    })

    it('should show file location in reference docs', async () => {
      const plugin = aiDoc()
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
        callingCode: '',
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
        renderTemplate: renderTemplateFn,
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

    it('should create .env.local and throw when installSkill is enabled without config', async () => {
      const { execSync } = await import('node:child_process')
      const plugin = aiDoc({ installSkill: true })
      const outputPath = 'src/api-skill-missing'
      plugin.config?.({ config: { output: outputPath } as any, projectPath: process.cwd(), reportProgress: vi.fn() })

      const data: any = {
        title: 'Skill Missing Test',
        version: '1.0.0',
        openapi: '3.0.1',
        baseUrl: '/api',
        allApis: [],
        components: [],
        componentNames: [],
        type: 'typescript',
        config: {},
        tagedApis: [],
      }

      await expect(
        plugin.codeGenerated?.({
          config: {} as any,
          data,
          filePaths: [],
          outputDir: resolve(process.cwd(), outputPath),
          projectPath: process.cwd(),
          reportProgress: vi.fn(),
          renderTemplate: renderTemplateFn,
        }),
      ).rejects.toThrow(/Created \.env\.local at project root/)

      const envContent = readVolFile(resolve(process.cwd(), '.env.local'), 'utf-8')
      expect(envContent).toContain('agent=')
      expect(envContent).toContain('https://www.npmjs.com/package/skills#supported-agents')

      const gitignoreContent = readVolFile(resolve(process.cwd(), '.gitignore'), 'utf-8')
      expect(gitignoreContent).toContain('*.local')

      expect(execSync).not.toHaveBeenCalled()
    })

    it('should install skill via skills CLI when installSkill is enabled and agent is configured', async () => {
      const { execSync } = await import('node:child_process')
      testVol.writeFileSync(resolve(process.cwd(), '.env.local'), 'agent=cursor\n', 'utf-8')

      const plugin = aiDoc({ installSkill: true })
      const outputPath = 'src/api-skill-install'
      plugin.config?.({ config: { output: outputPath } as any, projectPath: process.cwd(), reportProgress: vi.fn() })

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
        callingCode: '',
      }
      const data: any = {
        title: 'Skill Install Test',
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
        renderTemplate: renderTemplateFn,
      })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('cli.mjs'),
        expect.objectContaining({ cwd: process.cwd(), stdio: 'pipe' }),
      )
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('add'),
        expect.objectContaining({ cwd: process.cwd(), stdio: 'pipe' }),
      )
    })

    it('should throw via logger when .env.local exists but agent is missing', async () => {
      const { execSync } = await import('node:child_process')
      const throwErrorSpy = vi.spyOn(logger, 'throwError').mockReturnValue(new Error('mock missing agent'))

      testVol.writeFileSync(resolve(process.cwd(), '.env.local'), '# agent=\n', 'utf-8')

      const plugin = aiDoc({ installSkill: true })
      const outputPath = 'src/api-skill-empty-agent'
      plugin.config?.({ config: { output: outputPath } as any, projectPath: process.cwd(), reportProgress: vi.fn() })

      const data: any = {
        title: 'Skill Empty Agent Test',
        version: '1.0.0',
        openapi: '3.0.1',
        baseUrl: '/api',
        allApis: [],
        components: [],
        componentNames: [],
        type: 'typescript',
        config: {},
        tagedApis: [],
      }

      await expect(
        plugin.codeGenerated?.({
          config: {} as any,
          data,
          filePaths: [],
          outputDir: resolve(process.cwd(), outputPath),
          projectPath: process.cwd(),
          reportProgress: vi.fn(),
          renderTemplate: renderTemplateFn,
        }),
      ).rejects.toThrow('mock missing agent')

      expect(throwErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Please set the coding agent you are using'),
      )
      expect(throwErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.npmjs.com/package/skills#supported-agents'),
      )
      expect(execSync).not.toHaveBeenCalled()

      throwErrorSpy.mockRestore()
    })

    it('should not validate agent support and pass any agent value to skills CLI', async () => {
      const { execSync } = await import('node:child_process')
      testVol.writeFileSync(resolve(process.cwd(), '.env.local'), 'agent=unknown-agent\n', 'utf-8')

      const plugin = aiDoc({ installSkill: true })
      const outputPath = 'src/api-skill-no-validate'
      plugin.config?.({ config: { output: outputPath } as any, projectPath: process.cwd(), reportProgress: vi.fn() })

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
        callingCode: '',
      }
      const data: any = {
        title: 'Skill No Validate Test',
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
        renderTemplate: renderTemplateFn,
      })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('cli.mjs'),
        expect.objectContaining({ cwd: process.cwd(), stdio: 'pipe' }),
      )
      const callArg = (execSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(callArg).toContain('-a "unknown-agent"')
    })

    it('should throw via logger when skills CLI fails', async () => {
      const { execSync } = await import('node:child_process')
      const throwErrorSpy = vi.spyOn(logger, 'throwError').mockReturnValue(new Error('mock install failed'))
      ;(execSync as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('skills add failed')
      })

      testVol.writeFileSync(resolve(process.cwd(), '.env.local'), 'agent=cursor\n', 'utf-8')

      const plugin = aiDoc({ installSkill: true })
      const outputPath = 'src/api-skill-install-fail'
      plugin.config?.({ config: { output: outputPath } as any, projectPath: process.cwd(), reportProgress: vi.fn() })

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
        callingCode: '',
      }
      const data: any = {
        title: 'Skill Install Fail Test',
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

      await expect(
        plugin.codeGenerated?.({
          config: {} as any,
          data,
          filePaths: [],
          outputDir: resolve(process.cwd(), outputPath),
          projectPath: process.cwd(),
          reportProgress: vi.fn(),
          renderTemplate: renderTemplateFn,
        }),
      ).rejects.toThrow('mock install failed')

      expect(throwErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'skills add failed' }),
      )

      throwErrorSpy.mockRestore()
    })
  })

  describe('integration tests', () => {
    it('should not break generation when used as a plugin', async () => {
      const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [aiDoc()],
      )

      expect(apiDefinitionsFile).not.toBeUndefined()
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should work alongside other plugins', async () => {
      const { importType } = await import('@/plugins/presets/importType')
      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [aiDoc(), importType({ '@/models': ['User'] })],
      )

      expect(globalsFile).toMatch('declare global')
    })
  })
})
