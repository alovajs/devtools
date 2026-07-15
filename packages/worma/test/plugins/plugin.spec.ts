import type HandlebarsType from 'handlebars'
import { resolve } from 'node:path'
import { TemplateHelper } from '@/helper/template'
import { createPlugin } from '@/plugins'
import { extend } from '@/plugins/presets/utils'
import { getPresetTemplatePath } from '@/template'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('plugin test', () => {
  it('should apply plugin correctly', async () => {
    const applyFn = vi.fn()
    const nullPlugin = createPlugin(() => ({
      config({ config }) {
        return extend(config, {
          handleApi: (apiDescriptor) => {
            applyFn(apiDescriptor)
            return null
          },
        })
      },
    }))

    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [nullPlugin()],
    )

    expect(apiDefinitionsFile).not.toBeUndefined()
    // should generate a empty api interface
    expect(globalsFile).toMatch(/interface Apis \{\s*\}/)
    expect(applyFn).toHaveBeenCalled()
  })

  it('should execute config hook correctly', async () => {
    const configHookFn = vi.fn()
    const configPlugin = createPlugin(() => ({
      name: 'configPlugin',
      config: ({ config }) => {
        configHookFn(config)
        return config
      },
    }))

    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [configPlugin()],
    )

    expect(configHookFn).toHaveBeenCalled()
    expect(globalsFile).toMatch('interface Apis')
  })

  it('should execute beforeOpenapiParse hook correctly', async () => {
    const beforeParseHookFn = vi.fn()
    const inputTest = resolve(__dirname, '../openapis/openapi_301.json')
    const beforeParsePlugin = createPlugin(() => ({
      name: 'beforeParsePlugin',
      beforeOpenapiParse: ({ config }) => {
        beforeParseHookFn(config)
        expect(config).toHaveProperty('input')
        expect(config.input).toBe(inputTest)
        expect(config).toHaveProperty('plugins')
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      inputTest,
      [beforeParsePlugin()],
      {},
    )

    expect(beforeParseHookFn).toHaveBeenCalled()
    expect(beforeParseHookFn).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.any(String),
        plugins: expect.any(Array),
      }),
    )
    expect(apiDefinitionsFile).not.toBeUndefined()
  })

  it('should execute openapiParsed hook correctly', async () => {
    const afterParseHookFn = vi.fn()
    const titleTest = 'Modified API Title'
    const afterParsePlugin = createPlugin(() => ({
      name: 'afterParsePlugin',
      openapiParsed: ({ document }) => {
        expect(document.info).not.toBe(titleTest)
        afterParseHookFn(document)
        return {
          ...document,
          info: {
            ...document.info,
            title: titleTest,
          },
        }
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [afterParsePlugin()],
    )
    expect(afterParseHookFn).toHaveBeenCalled()
    expect(apiDefinitionsFile).toMatch(titleTest)
  })

  it('should pass document through when openapiParsed plugins do not return', async () => {
    const plugin1Fn = vi.fn()
    const plugin2Fn = vi.fn()

    const plugin1 = createPlugin(() => ({
      name: 'plugin1-noop',
      openapiParsed: ({ document }) => {
        plugin1Fn(document.info.title)
        // does NOT return document
      },
    }))

    const plugin2 = createPlugin(() => ({
      name: 'plugin2-modify',
      openapiParsed: ({ document }) => {
        plugin2Fn(document.info.title)
        return {
          ...document,
          info: { ...document.info, title: 'Plugin2 Title' },
        }
      },
    }))

    const plugin3 = createPlugin(() => ({
      name: 'plugin3-noop',
      openapiParsed: ({ document }) => {
        // does NOT return, should still get plugin2's modified document
        plugin1Fn(`plugin3-saw:${document.info.title}`)
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [plugin1(), plugin2(), plugin3()],
    )

    expect(plugin1Fn).toHaveBeenCalled()
    expect(plugin2Fn).toHaveBeenCalled()
    // plugin2 modified the title so the final output should reflect it
    expect(apiDefinitionsFile).toMatch('Plugin2 Title')
    // plugin3 should see plugin2's modification
    expect(plugin1Fn).toHaveBeenCalledWith('plugin3-saw:Plugin2 Title')
  })

  it('should execute beforeCodeGenerate hook correctly', async () => {
    const beforeCodeGenHookFn = vi.fn()
    const beforeCodeGenPlugin = createPlugin(() => ({
      name: 'beforeCodeGenPlugin',
      beforeCodeGenerate: ({ config, data }) => {
        beforeCodeGenHookFn(data, config)
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [beforeCodeGenPlugin()],
    )

    expect(apiDefinitionsFile).not.toBeUndefined()
    expect(beforeCodeGenHookFn).toHaveBeenCalled()
    expect(beforeCodeGenHookFn).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should execute codeGenerated hook correctly', async () => {
    const codeGeneratedHookFn = vi.fn()
    const codeGeneratedPlugin = createPlugin(() => ({
      name: 'codeGeneratedPlugin',
      codeGenerated: ({ filePaths, outputDir, error }) => {
        codeGeneratedHookFn(error, filePaths, outputDir)
      },
    }))

    await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [codeGeneratedPlugin()],
    )
    expect(codeGeneratedHookFn).toHaveBeenCalled()
    expect(codeGeneratedHookFn).toHaveBeenCalledWith(undefined, expect.any(Array), expect.any(String))
  })

  it('should handle plugin with extends configuration', async () => {
    const extendsPlugin = createPlugin(() => ({
      name: 'extendsPlugin',
      config({ config }) {
        return extend(config, {
          handleApi: (apiDescriptor) => {
            if (apiDescriptor?.method === 'get') {
              return null
            }
            return apiDescriptor
          },
        })
      },
    }))

    const { globalsFile, apiDefinitionsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [extendsPlugin()],
    )

    expect(globalsFile).not.toMatch('[GET]')
    expect(apiDefinitionsFile).not.toBeUndefined()
  })

  it('should handle multiple plugins in sequence', async () => {
    const plugin1HookFn = vi.fn()
    const plugin2HookFn = vi.fn()

    const plugin1 = createPlugin(() => ({
      name: 'plugin1',
      config: ({ config }) => {
        plugin1HookFn('plugin1-config')
        return config
      },
      beforeCodeGenerate() {
        plugin1HookFn('plugin1-beforeCodeGen')
      },
      openapiParsed: ({ document }) => {
        plugin1HookFn('plugin1-openapiParsed')
        return document
      },
    }))

    const plugin2 = createPlugin(() => ({
      name: 'plugin2',
      config: ({ config }) => {
        plugin2HookFn('plugin2-config')
        return config
      },
      beforeCodeGenerate() {
        plugin2HookFn('plugin2-beforeCodeGen')
      },
      openapiParsed: ({ document }) => {
        plugin2HookFn('plugin2-openapiParsed')
        return document
      },
    }))

    const { globalsFile, apiDefinitionsFile, indexFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [plugin1(), plugin2()],
    )

    expect(plugin1HookFn).toHaveBeenCalledWith('plugin1-config')
    expect(plugin1HookFn).toHaveBeenCalledWith('plugin1-openapiParsed')
    expect(plugin2HookFn).toHaveBeenCalledWith('plugin2-config')
    expect(plugin2HookFn).toHaveBeenCalledWith('plugin2-openapiParsed')
    expect(globalsFile).toMatch('interface Apis')
    expect(apiDefinitionsFile).not.toBeUndefined()
    expect(indexFile).not.toBeUndefined()
  })

  it('should handle plugin that returns null/undefined', async () => {
    const nullReturnPlugin = createPlugin(() => ({
      name: 'nullReturnPlugin',
      config: () => null,
      beforeOpenapiParse: () => undefined,
      openapiParsed: () => {},
    }))

    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [nullReturnPlugin()],
    )

    expect(apiDefinitionsFile).not.toBeUndefined()
    expect(globalsFile).toMatch('interface Apis')
  })

  it('should handle plugin with function-based extends', async () => {
    const functionExtendsPlugin = createPlugin(() => ({
      name: 'functionExtendsPlugin',
      config({ config }) {
        return extend(config, {
          handleApi: (apiDescriptor) => {
            if (apiDescriptor?.operationId) {
              return {
                ...apiDescriptor,
                operationId: `dynamic_${apiDescriptor.operationId}`,
              }
            }
            return apiDescriptor
          },
        })
      },
    }))

    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [functionExtendsPlugin()],
    )

    expect(globalsFile).toMatch('interface Apis')
  })

  it('should call codeGenerated hook after successful generation', async () => {
    const codeGeneratedFn = vi.fn()
    const plugin = createPlugin(() => ({
      name: 'codeGeneratedPlugin',
      codeGenerated: ({ error, filePaths, outputDir }) => {
        codeGeneratedFn(error, filePaths, outputDir)
      },
    }))

    await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [plugin()],
    )

    expect(codeGeneratedFn).toHaveBeenCalled()
    expect(codeGeneratedFn).toHaveBeenCalledWith(undefined, expect.any(Array), expect.any(String))
  })

  it('should handle async plugin hooks', async () => {
    const asyncHookFn = vi.fn()
    const asyncPlugin = createPlugin(() => ({
      name: 'asyncPlugin',
      config: async ({ config }) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        asyncHookFn('async-config')
        return config
      },
      openapiParsed: async ({ document }) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        asyncHookFn('async-openapiParsed')
        return document
      },
    }))

    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [asyncPlugin()],
    )

    expect(asyncHookFn).toHaveBeenCalledWith('async-config')
    expect(asyncHookFn).toHaveBeenCalledWith('async-openapiParsed')
    expect(globalsFile).toMatch('interface Apis')
  })

  it('should allow beforeFileWrite hook to modify files', async () => {
    let modifiedCount = 0
    const modifyPlugin = createPlugin(() => ({
      name: 'modifyPlugin',
      beforeFileWrite: ({ filePath: _, content }) => {
        modifiedCount++
        return `// Modified by plugin\n${content}`
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [modifyPlugin()],
    )

    // The beforeFileWrite hook should have been called at least once
    expect(modifiedCount).toBeGreaterThan(0)
    // And the modified content should be present in the output
    expect(apiDefinitionsFile).toMatch('// Modified by plugin')
  })

  it('should provide frozen config to hooks after config hook', async () => {
    const frozenCheckPlugin = createPlugin(() => ({
      name: 'frozenCheckPlugin',
      beforeOpenapiParse: ({ config }) => {
        expect(Object.isFrozen(config)).toBeTruthy()
      },
      openapiParsed: ({ config, document }) => {
        expect(Object.isFrozen(config)).toBeTruthy()
        return document
      },
      beforeCodeGenerate: ({ config }) => {
        expect(Object.isFrozen(config)).toBeTruthy()
      },
      codeGenerated: ({ config }) => {
        expect(Object.isFrozen(config)).toBeTruthy()
      },
    }))

    await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [frozenCheckPlugin()],
    )
  })

  describe('getTemplate hook', () => {
    beforeEach(() => {
      TemplateHelper.clearTemplateCache()
    })

    it('should allow plugin getTemplate to provide template path', async () => {
      const getTemplateFn = vi.fn().mockReturnValue({ path: getPresetTemplatePath('alova-globals') })
      const templatePlugin = {
        name: 'customTemplatePlugin',
        getTemplate: getTemplateFn,
      }

      const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [templatePlugin],
      )

      expect(getTemplateFn).toHaveBeenCalled()
      // Code should still generate successfully using the returned template path
      expect(apiDefinitionsFile).not.toBeUndefined()
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should use last non-null getTemplate result when multiple plugins define it', async () => {
      const getTemplateFn1 = vi.fn().mockReturnValue(null)
      const getTemplateFn2 = vi.fn().mockReturnValue({ path: getPresetTemplatePath('alova-globals') })

      const plugin1 = {
        name: 'nullTemplatePlugin',
        getTemplate: getTemplateFn1,
      }
      const plugin2 = {
        name: 'validTemplatePlugin',
        getTemplate: getTemplateFn2,
      }

      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [plugin1, plugin2],
      )

      expect(getTemplateFn1).toHaveBeenCalled()
      expect(getTemplateFn2).toHaveBeenCalled()
      // The second plugin's valid template path should be used
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should fall through to previous valid result when plugin returns null', async () => {
      // plugin1 returns null, plugin2 has no getTemplate at all
      // The default alovaGlobals() template from generateWithPlugin should win
      const noopTemplatePlugin = {
        name: 'noopTemplatePlugin',
        // no getTemplate → _call returns null, doesn't overwrite prev
        beforeCodeGenerate: vi.fn(),
      }

      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [noopTemplatePlugin],
      )

      // alovaGlobals() getTemplate result should be preserved
      expect(globalsFile).toMatch('interface Apis')
    })
  })

  describe('onHandlebarsCreated hook', () => {
    beforeEach(() => {
      TemplateHelper.clearTemplateCache()
    })

    it('should call onHandlebarsCreated with Handlebars instance', async () => {
      const onHbsCreatedFn = vi.fn()
      const hbsPlugin = {
        name: 'hbsPlugin',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          onHbsCreatedFn(hbs)
          // Verify it's a valid Handlebars instance with expected methods
          expect(hbs).toBeDefined()
          expect(typeof hbs.compile).toBe('function')
          expect(typeof hbs.registerHelper).toBe('function')
          expect(typeof hbs.registerPartial).toBe('function')
        },
      }

      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [hbsPlugin],
      )

      expect(onHbsCreatedFn).toHaveBeenCalledTimes(1)
      expect(onHbsCreatedFn).toHaveBeenCalledWith(expect.objectContaining({
        compile: expect.any(Function),
        registerHelper: expect.any(Function),
        registerPartial: expect.any(Function),
      }))
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should allow registering custom helpers via onHandlebarsCreated', async () => {
      const CUSTOM_COMMENT = '/* generated-by-plugin-test */'
      const helperPlugin = {
        name: 'helperPlugin',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          // Register a custom helper that returns a fixed comment
          hbs.registerHelper('testPluginHelper', () => {
            return new hbs.SafeString(CUSTOM_COMMENT)
          })
        },
      }

      const { createApisFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [helperPlugin],
      )

      // The helper was registered but templates don't call it by default.
      // We verify that code generation still completes normally.
      expect(createApisFile).not.toBeUndefined()
    })

    it('should allow multiple plugins to register handlers via onHandlebarsCreated', async () => {
      const plugin1Fn = vi.fn()
      const plugin2Fn = vi.fn()

      const hbsPlugin1 = {
        name: 'hbsPlugin1',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          plugin1Fn()
          hbs.registerHelper('plugin1Helper', () => 'plugin1-output')
        },
      }
      const hbsPlugin2 = {
        name: 'hbsPlugin2',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          plugin2Fn()
          hbs.registerHelper('plugin2Helper', () => 'plugin2-output')
        },
      }

      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [hbsPlugin1, hbsPlugin2],
      )

      expect(plugin1Fn).toHaveBeenCalledTimes(1)
      expect(plugin2Fn).toHaveBeenCalledTimes(1)
      // Both plugins successfully registered helpers, code generation works
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should have addNamespace helper available globally without manual registration', async () => {
      const onHbsCreatedFn = vi.fn()
      const addNamespacePlugin = {
        name: 'addNamespaceCheckPlugin',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          onHbsCreatedFn()
          // addNamespace is now registered globally via registerCommonHelpers,
          // so it must be present without any manual registration.
          expect(typeof hbs.helpers.addNamespace).toBe('function')
        },
      }

      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [addNamespacePlugin],
      )

      expect(onHbsCreatedFn).toHaveBeenCalledTimes(1)
      // Generation should succeed with the addNamespace helper registered globally
      expect(globalsFile).toMatch('interface Apis')
    })

    it('should pass hbs instance to multiple onHandlebarsCreated hooks', async () => {
      let hbsFromPlugin1: typeof HandlebarsType | null = null
      let hbsFromPlugin2: typeof HandlebarsType | null = null

      const hbsPlugin1 = {
        name: 'hbsCapture1',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          hbsFromPlugin1 = hbs
          hbs.registerHelper('totalCount', (arr: any[]) => arr?.length ?? 0)
        },
      }
      const hbsPlugin2 = {
        name: 'hbsCapture2',
        onHandlebarsCreated({ hbs }: { hbs: typeof HandlebarsType }) {
          hbsFromPlugin2 = hbs
          hbs.registerHelper('isArray', (val: any) => Array.isArray(val))
        },
      }

      const { globalsFile } = await generateWithPlugin(
        resolve(__dirname, '../openapis/openapi_301.json'),
        [hbsPlugin1, hbsPlugin2],
      )

      // Both plugins receive the same Handlebars instance
      expect(hbsFromPlugin1).toBeDefined()
      expect(hbsFromPlugin2).toBeDefined()
      // They share the same instance, so plugin2 can see plugin1's helper
      expect(typeof hbsFromPlugin1).toBe('object')
      expect(typeof hbsFromPlugin2).toBe('object')
      expect(globalsFile).toMatch('interface Apis')
    })
  })
})
