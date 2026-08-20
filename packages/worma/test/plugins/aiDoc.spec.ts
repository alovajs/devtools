/* eslint-disable ts/no-require-imports */
import type { RenderTemplateParams } from '@/helper/config/type'
import { resolve } from 'node:path'
import { logger } from '@/helper/logger'
import { TemplateHelper } from '@/helper/template'
import { aiDoc, parseAgentFile, parseAgentList } from '@/plugins/presets/aiDoc'
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
            tag: 'pets',
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
            tag: 'test',
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
            tag: 'default',
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
            tag: 'users',
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

    // ---- skill install (agent) helpers ----
    const minimalData = (title = 'Skill Test'): any => ({
      title,
      version: '1.0.0',
      openapi: '3.0.1',
      baseUrl: '/api',
      allApis: [],
      components: [],
      componentNames: [],
      type: 'typescript',
      config: {},
      tagedApis: [],
    })

    const getInstalledAgents = async (): Promise<string[]> => {
      const { execSync } = await import('node:child_process')
      const calls = (execSync as ReturnType<typeof vi.fn>).mock.calls as any[]
      return calls
        .map((c) => {
          const match = (c[0] as string).match(/-a\s+"([^"]+)"/)
          return match ? match[1] : undefined
        })
        .filter(Boolean) as string[]
    }

    const runInstallTest = async (
      agent: string | any[] | any,
      outputPath = 'src/api-skill',
    ) => {
      const plugin = aiDoc({ agent })
      plugin.config?.({ config: { output: outputPath } as any, projectPath: process.cwd(), reportProgress: vi.fn() })
      await plugin.codeGenerated?.({
        config: {} as any,
        data: minimalData(),
        filePaths: [],
        outputDir: resolve(process.cwd(), outputPath),
        projectPath: process.cwd(),
        reportProgress: vi.fn(),
        renderTemplate: renderTemplateFn,
      })
    }

    it('should install to codex when agent is the string "codex"', async () => {
      const { execSync } = await import('node:child_process')
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      await runInstallTest('codex', 'src/api-skill-default')

      // No local config file is created anymore
      expect(testVol.existsSync(resolve(process.cwd(), 'node_modules', '.worma', 'skills.local'))).toBe(false)
      expect(execSync).toHaveBeenCalledTimes(1)
      const callArg = (execSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(callArg).toContain('-a "codex"')
      expect(callArg).toContain('cli.mjs')
      expect(callArg).toContain('add')

      // Agent is explicit -> no default-agent warning
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('should NOT warn when an explicit agent string is given', async () => {
      const { execSync } = await import('node:child_process')
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      await runInstallTest('cursor', 'src/api-skill-cursor-no-warn')

      expect(execSync).toHaveBeenCalledTimes(1)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('should accept a typed SkillAgent and install to it', async () => {
      const { execSync } = await import('node:child_process')
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      await runInstallTest('claude-code' as any, 'src/api-skill-typed-agent')

      expect(execSync).toHaveBeenCalledTimes(1)
      expect((execSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string).toContain('-a "claude-code"')
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('should accept a SkillAgent[] and install to each agent', async () => {
      await runInstallTest(['cursor', 'claude-code', 'windsurf'] as any, 'src/api-skill-typed-array')

      expect(await getInstalledAgents()).toEqual(['cursor', 'claude-code', 'windsurf'])
    })

    it('should dedupe a SkillAgent[] with repeated entries', async () => {
      await runInstallTest(['cursor', 'cursor', 'windsurf'] as any, 'src/api-skill-typed-array-dedupe')

      expect(await getInstalledAgents()).toEqual(['cursor', 'windsurf'])
    })

    it('should install to the agent specified by the agent string', async () => {
      const { execSync } = await import('node:child_process')

      await runInstallTest('cursor', 'src/api-skill-cursor')

      expect(execSync).toHaveBeenCalledTimes(1)
      const callArg = (execSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(callArg).toContain('-a "cursor"')
      expect(callArg).toContain('cli.mjs')
      expect(callArg).toContain('add')
    })

    it('should not create node_modules/.worma/skills.local', async () => {
      await runInstallTest('cursor', 'src/api-skill-no-local')

      expect(testVol.existsSync(resolve(process.cwd(), 'node_modules', '.worma', 'skills.local'))).toBe(false)
    })

    it('should not validate agent support and pass any agent value to skills CLI', async () => {
      const { execSync } = await import('node:child_process')

      await runInstallTest('unknown-agent', 'src/api-skill-no-validate')

      expect(execSync).toHaveBeenCalledTimes(1)
      expect((execSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string).toContain('-a "unknown-agent"')
    })

    it('should install skill into every comma-separated agent in the agent string', async () => {
      await runInstallTest('cursor, claude-code, windsurf', 'src/api-skill-multi-agent')

      expect(await getInstalledAgents()).toEqual(['cursor', 'claude-code', 'windsurf'])
    })

    it('should dedupe repeated agents when installing skill', async () => {
      await runInstallTest('cursor, cursor, claude-code', 'src/api-skill-dedupe')

      expect(await getInstalledAgents()).toEqual(['cursor', 'claude-code'])
    })

    it('should install skill into agents separated by a Chinese comma', async () => {
      await runInstallTest('cursor，claude-code', 'src/api-skill-cn-comma')

      expect(await getInstalledAgents()).toEqual(['cursor', 'claude-code'])
    })

    it('should NOT install when the agent string yields no agent', async () => {
      const { execSync } = await import('node:child_process')

      // A string with only separators parses to no usable agent -> nothing installed
      await runInstallTest('，', 'src/api-skill-empty-string')

      expect(execSync).not.toHaveBeenCalled()
    })

    it('should throw via logger when skills CLI fails', async () => {
      const { execSync } = await import('node:child_process')
      const throwErrorSpy = vi.spyOn(logger, 'throwError').mockReturnValue(new Error('mock install failed'))
      ;(execSync as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('skills add failed')
      })

      await expect(
        runInstallTest('cursor', 'src/api-skill-install-fail'),
      ).rejects.toThrow('mock install failed')

      expect(throwErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'skills add failed' }),
      )

      throwErrorSpy.mockRestore()
    })

    it('parseAgentList should split comma-separated agents, trim and dedupe', () => {
      expect(parseAgentList('cursor')).toEqual(['cursor'])
      expect(parseAgentList('cursor, claude-code')).toEqual(['cursor', 'claude-code'])
      expect(parseAgentList(' cursor , claude-code , windsurf ')).toEqual([
        'cursor',
        'claude-code',
        'windsurf',
      ])
      // Chinese comma is supported, mixed with English comma and arbitrary spacing
      expect(parseAgentList('cursor，claude-code')).toEqual(['cursor', 'claude-code'])
      expect(parseAgentList('cursor， claude-code ，windsurf')).toEqual([
        'cursor',
        'claude-code',
        'windsurf',
      ])
      expect(parseAgentList('cursor,claude-code，windsurf')).toEqual([
        'cursor',
        'claude-code',
        'windsurf',
      ])
      // zero spaces around commas
      expect(parseAgentList('cursor,claude-code,windsurf')).toEqual([
        'cursor',
        'claude-code',
        'windsurf',
      ])
      // duplicate entries are removed
      expect(parseAgentList('cursor, cursor, claude-code')).toEqual(['cursor', 'claude-code'])
      expect(parseAgentList('cursor，cursor，claude-code')).toEqual(['cursor', 'claude-code'])
      // whitespace-only / empty entries are ignored
      expect(parseAgentList('')).toEqual([])
      expect(parseAgentList(' , , ')).toEqual([])
      expect(parseAgentList('，,，')).toEqual([])
      expect(parseAgentList('cursor,,claude-code')).toEqual(['cursor', 'claude-code'])
      // quotes around values are preserved as-is (callers pass clean names)
      expect(parseAgentList('"cursor", "claude-code"')).toEqual(['"cursor"', '"claude-code"'])
    })

    describe('parseAgentFile', () => {
      it('parses key=value pairs, ignoring # comments and blank lines', () => {
        const p = resolve(process.cwd(), '.myagents')
        testVol.writeFileSync(p, [
          '# this is a comment',
          'agent=cursor, claude-code',
          '',
          '  # indented comment',
          'token="abc123"',
          'name=\'my skill\'',
        ].join('\n'), 'utf-8')

        const result = parseAgentFile(p)
        expect(result.agent).toBe('cursor, claude-code')
        expect(result.token).toBe('abc123')
        expect(result.name).toBe('my skill')
        expect(result).not.toHaveProperty('# this is a comment')
      })

      it('ignores lines without =', () => {
        const p = resolve(process.cwd(), '.myagents2')
        testVol.writeFileSync(p, ['just text', 'agent=cursor', '=novalue'].join('\n'), 'utf-8')
        const result = parseAgentFile(p)
        expect(result).toEqual({ agent: 'cursor' })
      })

      it('strips surrounding quotes from values', () => {
        const p = resolve(process.cwd(), '.myagents3')
        testVol.writeFileSync(p, 'agent="cursor, claude-code"\n', 'utf-8')
        const result = parseAgentFile(p)
        expect(result.agent).toBe('cursor, claude-code')
      })

      it('tolerates leading indentation and spaces around the equals sign', () => {
        const p = resolve(process.cwd(), '.myagents-spaced')
        testVol.writeFileSync(p, [
          '  agent = cursor, claude-code', // indented + spaces around =
          '  token   =   "abc123"', // spaces around = + quoted value with spaces
          'name\t=  "my skill"', // tab indent + spaces around =
          '# trailing comment line',
        ].join('\n'), 'utf-8')

        const result = parseAgentFile(p)
        expect(result.agent).toBe('cursor, claude-code')
        expect(result.token).toBe('abc123')
        expect(result.name).toBe('my skill')
      })

      it('can be fed into agent to set the agent for the current user', () => {
        const p = resolve(process.cwd(), '.myagents4')
        testVol.writeFileSync(p, 'agent=cursor, windsurf\n', 'utf-8')
        const cfg = parseAgentFile(p)
        const plugin = aiDoc({ agent: cfg.agent })
        expect(plugin.name).toBe('aiDoc')
      })

      it('falls back to .wormaagent.local in cwd when no path is given', () => {
        const defaultPath = resolve(process.cwd(), '.wormaagent.local')
        testVol.writeFileSync(defaultPath, 'agent=codex, cursor\n', 'utf-8')
        const result = parseAgentFile()
        expect(result.agent).toBe('codex, cursor')
        testVol.rmSync(defaultPath, { force: true })
      })
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
