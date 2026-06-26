import type { GeneratorConfig } from '@/type'
import { resolve } from 'node:path'
import { generate } from '@/index'

const baseConfig = {
  input: 'http://localhost:3000/openapi.json',
  output: './src/api',
  plugins: [{ getTemplate: () => ({ path: './template' }) }],
}

/**
 * 验证配置参数合法（通过校验后进入文件读取阶段，不再抛出运行时错误）
 * `generate()` now catches per-generator runtime errors and returns `false` instead of throwing.
 * This helper asserts that config-level validation passed (result is an array).
 */
async function expectConfigValid(generatorOverrides: Partial<GeneratorConfig> = {}) {
  const result = await generate({
    generator: [{ ...baseConfig, ...generatorOverrides }],
  })
  expect(Array.isArray(result)).toBe(true)
}

describe('validate config', () => {
  describe('required fields', () => {
    it('should throw error when generator is empty', async () => {
      await expect(generate({} as any)).rejects.toThrow('No items found in the `config.generator`')
    })

    it('should throw error when input is not specified', async () => {
      await expect(
        generate({
          generator: [{} as any],
        }),
      ).rejects.toThrow('Field input is required in `config.generator`')
    })

    it('should throw error when output is not specified', async () => {
      await expect(
        generate({
          generator: [
            {
              input: 'http://localhost:3000/openapi.json',
            },
          ],
        } as any),
      ).rejects.toThrow('Field output is required in `config.generator`')
    })

    it('should return false when no plugin provides getTemplate', async () => {
      const result = await generate({
        generator: [
          {
            input: resolve(__dirname, './openapis/openapi_300.yaml'),
            output: './src/api',
          },
        ],
      } as any)
      expect(result).toEqual([false])
    })

    it('should accept input as an array of strings', async () => {
      await expectConfigValid({
        input: ['http://localhost:3000/openapi.json', 'http://localhost:3000/openapi.yaml'],
      })
    })

    it('should throw error when input array is empty', async () => {
      await expect(
        generate({
          generator: [
            {
              input: [] as any,
              output: './src/api',
              plugins: [{ getTemplate: () => ({ path: './template' }) }],
            },
          ],
        }),
      ).rejects.toThrow()
    })

    it('should throw error when input array contains non-string', async () => {
      await expect(
        generate({
          generator: [
            {
              input: ['http://localhost:3000/openapi.json', 123] as any,
              output: './src/api',
              plugins: [{ getTemplate: () => ({ path: './template' }) }],
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('plugins validation', () => {
    it('should accept plugins with getTemplate hook that returns a path', async () => {
      await expectConfigValid()
    })
  })

  describe('output uniqueness', () => {
    it('should throw error when output is repeated', async () => {
      await expect(
        generate({
          generator: [
            {
              input: 'http://localhost:3000/openapi.json',
              output: './src/api',
              plugins: [{ getTemplate: () => ({ path: '' }) }],
            },
            {
              input: 'http://localhost:3000/openapi2.json',
              output: './src/api',
              plugins: [{ getTemplate: () => ({ path: '' }) }],
            },
          ],
        }),
      ).rejects.toThrow('output `./src/api` is repeated at "generator.generator.output"')
    })
  })

  describe('type field validation', () => {
    it('should accept valid type values', async () => {
      const validTypes = ['auto', 'ts', 'typescript', 'module', 'commonjs'] as const
      for (const type of validTypes) {
        await expectConfigValid({ type })
      }
    })

    it('should throw error when type is invalid', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              type: 'invalid' as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('docComment field validation', () => {
    it('should accept boolean value for docComment', async () => {
      await expectConfigValid({ docComment: true })
      await expectConfigValid({ docComment: false })
    })

    it('should throw error when docComment is not boolean', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              docComment: 'true' as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('responseMediaType field validation', () => {
    it('should accept string value for responseMediaType', async () => {
      await expectConfigValid({ responseMediaType: 'application/json' })
    })

    it('should accept array of strings for responseMediaType', async () => {
      await expectConfigValid({ responseMediaType: ['application/json', 'text/plain'] })
    })

    it('should throw error when responseMediaType is invalid', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              responseMediaType: 123 as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('bodyMediaType field validation', () => {
    it('should accept string value for bodyMediaType', async () => {
      await expectConfigValid({ bodyMediaType: 'application/json' })
    })

    it('should accept array of strings for bodyMediaType', async () => {
      await expectConfigValid({ bodyMediaType: ['application/json', 'multipart/form-data'] })
    })

    it('should throw error when bodyMediaType is invalid', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              bodyMediaType: 123 as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('serverName field validation', () => {
    it('should accept string value for serverName', async () => {
      await expectConfigValid({ serverName: 'my-server' })
    })

    it('should accept empty string for serverName', async () => {
      await expectConfigValid({ serverName: '' })
    })

    it('should throw error when serverName is not string', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              serverName: 123 as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('defaultRequire field validation', () => {
    it('should accept boolean value for defaultRequire', async () => {
      await expectConfigValid({ defaultRequire: true })
      await expectConfigValid({ defaultRequire: false })
    })

    it('should throw error when defaultRequire is not boolean', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              defaultRequire: 'true' as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('externalTypes field validation', () => {
    it('should accept array of strings for externalTypes', async () => {
      await expectConfigValid({ externalTypes: ['File', 'Blob', 'FormData'] })
    })

    it('should accept empty array for externalTypes', async () => {
      await expectConfigValid({ externalTypes: [] })
    })

    it('should throw error when externalTypes contains non-string', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              externalTypes: ['File', 123] as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })

    it('should throw error when externalTypes is not array', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              externalTypes: 'File' as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('fetchOptions field validation', () => {
    it('should accept object for fetchOptions', async () => {
      await expectConfigValid({
        fetchOptions: { headers: { Authorization: 'Bearer token' }, timeout: 5000 },
      })
    })

    it('should accept fetchOptions with all supported keys', async () => {
      await expectConfigValid({
        fetchOptions: {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
          method: 'POST' as any,
          data: { key: 'value' } as any,
          params: { page: 1 },
          insecure: true,
        },
      })
    })

    it('should accept empty object for fetchOptions', async () => {
      await expectConfigValid({
        fetchOptions: {},
      })
    })

    it('should throw error when fetchOptions is a string', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              fetchOptions: 'invalid' as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })

    it('should throw error when fetchOptions is a number', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              fetchOptions: 123 as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('plugins field validation', () => {
    it('should accept array of plugins', async () => {
      await expectConfigValid({ plugins: [{ name: 'test-plugin' }] })
    })

    it('should accept empty array for plugins', async () => {
      await expectConfigValid({ plugins: [] })
    })

    it('should accept multiple plugins', async () => {
      await expectConfigValid({
        plugins: [
          { name: 'plugin1' },
          { name: 'plugin2', config: () => undefined },
        ],
      })
    })

    it('should accept plugin with all hook functions', async () => {
      await expectConfigValid({
        plugins: [{
          name: 'full-plugin',
          config: () => undefined,
          beforeOpenapiParse: () => {},
          openapiParsed: () => undefined,
          beforeCodeGenerate: () => undefined,
          codeGenerated: () => {},
        }],
      })
    })

    it('should throw error when plugins is not array', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              plugins: {} as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })

    it('should throw error when plugin hooks are not functions', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              plugins: [{ name: 'bad-plugin', beforeOpenapiParse: 'not-a-function' } as any],
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('handleApi field validation', () => {
    it('should accept function for handleApi', async () => {
      await expectConfigValid({ handleApi: (api: any) => api })
    })

    it('should accept handleApi that returns undefined', async () => {
      await expectConfigValid({ handleApi: () => undefined })
    })

    it('should accept handleApi that returns null', async () => {
      await expectConfigValid({ handleApi: () => null })
    })

    it('should throw error when handleApi is not function', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              handleApi: {} as any,
            },
          ],
        }),
      ).rejects.toThrow()
    })
  })

  describe('file not found', () => {
    it('should return false when generating from a file that does not exist (runtime error caught)', async () => {
      const result = await generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            plugins: [{ getTemplate: () => ({ path: '' }) }],
          },
        ],
      })
      expect(result).toEqual([false])
    })
  })
})
