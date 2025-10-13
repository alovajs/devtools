import { resolve } from 'node:path'
import { createPlugin } from '@/plugins'
import { extend } from '@/plugins/presets/utils'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('plugin test', () => {
  it('should apply plugin correctly', async () => {
    const applyFn = vi.fn()
    const nullPlugin = createPlugin(() => ({
      config(config) {
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
    expect(globalsFile).toMatch('interface Apis {}')
    expect(applyFn).toHaveBeenCalled()
  })

  it('should execute config hook correctly', async () => {
    const configHookFn = vi.fn()
    const configPlugin = createPlugin(() => ({
      name: 'configPlugin',
      config: (config) => {
        configHookFn(config)
        return {
          ...config,
          global: 'CustomApis',
        }
      },
    }))

    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [configPlugin()],
    )

    expect(configHookFn).toHaveBeenCalled()
    expect(globalsFile).toMatch('interface CustomApis')
  })

  it('should execute beforeOpenapiParse hook correctly', async () => {
    const beforeParseHookFn = vi.fn()
    const inputPath = resolve(__dirname, '../openapis/openapi_301.json')
    const inputTest = 'test'
    const beforeParsePlugin = createPlugin(() => ({
      name: 'beforeParsePlugin',
      beforeOpenapiParse: (inputConfig) => {
        beforeParseHookFn(inputConfig)
        // Verify the inputConfig has the expected structure
        expect(inputConfig).toHaveProperty('input')
        expect(inputConfig.input).toBe(inputTest)
        expect(inputConfig).toHaveProperty('platform')
        expect(inputConfig).toHaveProperty('plugins')

        // Return modified config to test the hook actually works
        return {
          ...inputConfig,
          input: inputPath, // Modify input for testing
        }
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      inputTest,
      [beforeParsePlugin()],
      {
        platform: 'swagger',
      },
    )

    expect(beforeParseHookFn).toHaveBeenCalled()
    expect(beforeParseHookFn).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.any(String),
        platform: expect.anything(),
        plugins: expect.any(Array),
      }),
    )
    expect(apiDefinitionsFile).not.toBeUndefined()
  })

  it('should execute afterOpenapiParse hook correctly', async () => {
    const afterParseHookFn = vi.fn()
    const titleTest = 'Modified API Title'
    const afterParsePlugin = createPlugin(() => ({
      name: 'afterParsePlugin',
      afterOpenapiParse: (document) => {
        expect(document.info).not.toBe(titleTest)
        afterParseHookFn(document)
        // Modify document title for testing
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

  it('should execute beforeCodeGenerate hook correctly', async () => {
    const beforeCodeGenHookFn = vi.fn()
    const beforeCodeGenPlugin = createPlugin(() => ({
      name: 'beforeCodeGenPlugin',
      beforeCodeGenerate: (data, outputFile) => {
        beforeCodeGenHookFn(data, outputFile)
        // Return modified template data
        if (outputFile === 'apiDefinitions.ts') {
          return `// Custom header added by plugin
          // ${JSON.stringify(data)}`
        }
        return null // Let other files be handled normally
      },
    }))

    const { apiDefinitionsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [beforeCodeGenPlugin()],
    )

    expect(beforeCodeGenHookFn).toHaveBeenCalled()
    expect(apiDefinitionsFile).toContain('// Custom header added by plugin')
  })

  it('should execute afterCodeGenerate hook correctly', async () => {
    const afterCodeGenHookFn = vi.fn()
    const afterCodeGenPlugin = createPlugin(() => ({
      name: 'afterCodeGenPlugin',
      afterCodeGenerate: (error) => {
        afterCodeGenHookFn(error)
      },
    }))

    await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [afterCodeGenPlugin()],
    )
    expect(afterCodeGenHookFn).toHaveBeenCalled()
    expect(afterCodeGenHookFn).toHaveBeenCalledWith(undefined) // Error expected due to invalid code
  })

  it('should handle plugin with extends configuration', async () => {
    const extendsPlugin = createPlugin(() => ({
      name: 'extendsPlugin',
      config(config) {
        return extend(config, {
          global: 'ExtendsApis',
          handleApi: (apiDescriptor) => {
            if (apiDescriptor?.method === 'get') {
              return null // Filter out get operations
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
      config: (config) => {
        plugin1HookFn('plugin1-config')
        return { ...config, global: 'Plugin1Apis', globalHost: 'Plugin1Host' }
      },
      beforeCodeGenerate(data, outputFile) {
        if (outputFile === 'apiDefinitions.ts') {
          return `// Custom header added by plugin1
          // ${JSON.stringify(data)}`
        }
        return null // Let other files be handled normally
      },
      afterOpenapiParse: (document) => {
        plugin1HookFn('plugin1-afterParse')
        return document
      },
    }))

    const plugin2 = createPlugin(() => ({
      name: 'plugin2',
      config: (config) => {
        plugin2HookFn('plugin2-config')
        return { ...config, global: 'Plugin2Apis' } // This should override plugin1
      },
      beforeCodeGenerate(data, outputFile) {
        if (outputFile === 'index.ts') {
          return `// Custom header added by plugin2
          // ${JSON.stringify(data)}`
        }
        return null // Let other files be handled normally
      },
      afterOpenapiParse: (document) => {
        plugin2HookFn('plugin2-afterParse')
        return document
      },
    }))

    const { globalsFile, apiDefinitionsFile, createApisFile, indexFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [plugin1(), plugin2()],
    )

    expect(plugin1HookFn).toHaveBeenCalledWith('plugin1-config')
    expect(plugin1HookFn).toHaveBeenCalledWith('plugin1-afterParse')
    expect(plugin2HookFn).toHaveBeenCalledWith('plugin2-config')
    expect(plugin2HookFn).toHaveBeenCalledWith('plugin2-afterParse')
    expect(globalsFile).toMatch('interface Plugin2Apis') // Last plugin wins
    expect(createApisFile).toMatch('(Plugin1Host as any).Plugin2Apis = Apis')
    expect(apiDefinitionsFile).toContain('// Custom header added by plugin1')
    expect(indexFile).toContain('// Custom header added by plugin2')
  })

  it('should handle plugin that returns null/undefined', async () => {
    const nullReturnPlugin = createPlugin(() => ({
      name: 'nullReturnPlugin',
      config: () => null, // Return null
      beforeOpenapiParse: () => undefined, // Return undefined
      afterOpenapiParse: () => {}, // Return void
    }))

    const { apiDefinitionsFile, globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [nullReturnPlugin()],
    )

    expect(apiDefinitionsFile).not.toBeUndefined()
    expect(globalsFile).toMatch('interface Apis') // Should use default
  })

  it('should handle plugin with function-based extends', async () => {
    const functionExtendsPlugin = createPlugin(() => ({
      name: 'functionExtendsPlugin',
      config(config) {
        return extend(config, {
          global: `Dynamic${config.type?.toUpperCase()}Apis`,
          handleApi: (apiDescriptor) => {
            // Add a prefix to operation IDs
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

    expect(globalsFile).toMatch('interface DynamicTSApis')
  })

  it('should handle plugin error in afterCodeGenerate hook', async () => {
    const errorHandlerFn = vi.fn()
    const errorPlugin = createPlugin(() => ({
      name: 'errorPlugin',
      beforeCodeGenerate: () => {
        throw new Error('Test error in code generation')
      },
      afterCodeGenerate: (error) => {
        errorHandlerFn(error)
      },
    }))

    // This should not throw, but the error should be passed to afterCodeGenerate
    await expect(generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [errorPlugin()],
    )).rejects.toThrow()

    expect(errorHandlerFn).toHaveBeenCalled()
    expect(errorHandlerFn).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should handle async plugin hooks', async () => {
    const asyncHookFn = vi.fn()
    const asyncPlugin = createPlugin(() => ({
      name: 'asyncPlugin',
      config: async (config) => {
        await new Promise(resolve => setTimeout(resolve, 10)) // Simulate async work
        asyncHookFn('async-config')
        return { ...config, global: 'AsyncApis' }
      },
      afterOpenapiParse: async (document) => {
        await new Promise(resolve => setTimeout(resolve, 10)) // Simulate async work
        asyncHookFn('async-afterParse')
        return document
      },
    }))

    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [asyncPlugin()],
    )

    expect(asyncHookFn).toHaveBeenCalledWith('async-config')
    expect(asyncHookFn).toHaveBeenCalledWith('async-afterParse')
    expect(globalsFile).toMatch('interface AsyncApis')
  })
})
