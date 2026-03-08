import type { GeneratorConfig } from '@/type'
import { generate } from '@/index'

const baseConfig = {
  input: 'http://localhost:3000/openapi.json',
  output: './src/api',
  template: () => ({
    path: './template',
  }),
}

/**
 * 验证配置参数合法（通过校验后进入文件读取阶段，抛出 "Cannot read file" 错误）
 */
async function expectConfigValid(generatorOverrides: Partial<GeneratorConfig> = {}) {
  await expect(
    generate({
      generator: [{ ...baseConfig, ...generatorOverrides }],
    }),
  ).rejects.toThrow('Cannot read file')
}

/**
 * 验证配置参数合法（支持自定义根配置）
 */
async function expectRootConfigValid(config: { generator: any[], autoUpdate?: any }) {
  await expect(generate(config)).rejects.toThrow('Cannot read file')
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

    it('should throw error when template is not specified', async () => {
      await expect(
        generate({
          generator: [
            {
              input: 'http://localhost:3000/openapi.json',
              output: './src/api',
            },
          ],
        } as any),
      ).rejects.toThrow('Required at "generator[0].template"')
    })
  })

  describe('template validation', () => {
    it('should throw error when template is not a function', async () => {
      await expect(
        generate({
          generator: [
            {
              input: 'http://localhost:3000/openapi.json',
              output: './src/api',
              template: {} as any,
            },
          ],
        }),
      ).rejects.toThrow('Expected function, received object at "generator[0].template"')
    })

    it('should accept template as a function', async () => {
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
              template: () => ({ path: '' }),
            },
            {
              input: 'http://localhost:3000/openapi2.json',
              output: './src/api',
              template: () => ({ path: '' }),
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

  describe('platform field validation', () => {
    it('should accept valid platform values', async () => {
      const validPlatforms = ['swagger', 'knife4j', 'yapi'] as const
      for (const platform of validPlatforms) {
        await expectConfigValid({ platform })
      }
    })

    it('should throw error when platform is invalid', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              platform: 'invalid' as any,
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

  describe('version field validation', () => {
    it('should accept number value for version', async () => {
      await expectConfigValid({ version: 2 })
      await expectConfigValid({ version: 3 })
    })

    it('should accept string value for version', async () => {
      await expectConfigValid({ version: '2' })
    })

    it('should throw error when version is invalid type', async () => {
      await expect(
        generate({
          generator: [
            {
              ...baseConfig,
              version: {} as any,
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
  })

  describe('plugins field validation', () => {
    it('should accept array of plugins', async () => {
      await expectConfigValid({ plugins: [{ name: 'test-plugin' }] })
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
  })

  describe('handleApi field validation', () => {
    it('should accept function for handleApi', async () => {
      await expectConfigValid({ handleApi: (api: any) => api })
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

  describe('autoUpdate field validation', () => {
    it('should accept boolean value for autoUpdate', async () => {
      await expectRootConfigValid({ generator: [baseConfig], autoUpdate: true })
      await expectRootConfigValid({ generator: [baseConfig], autoUpdate: false })
    })

    it('should accept object with interval for autoUpdate', async () => {
      await expectRootConfigValid({ generator: [baseConfig], autoUpdate: { interval: 5000 } })
    })

    it('should accept object with launchEditor for autoUpdate', async () => {
      await expectRootConfigValid({
        generator: [baseConfig],
        autoUpdate: { interval: 5000, launchEditor: true },
      })
    })

    it('should throw error when autoUpdate.interval is not a number', async () => {
      await expect(
        generate({
          generator: [baseConfig],
          autoUpdate: {
            interval: 'abc' as any,
          },
        }),
      ).rejects.toThrow('autoUpdate.interval must be a number')
    })

    it('should throw error when autoUpdate.interval is less than or equal to 0', async () => {
      await expect(
        generate({
          generator: [baseConfig],
          autoUpdate: {
            interval: -1,
          },
        }),
      ).rejects.toThrow('Expected to set number which great than 1 in `config.autoUpdate.interval`')
    })

    it('should throw error when autoUpdate.interval is 0', async () => {
      await expect(
        generate({
          generator: [baseConfig],
          autoUpdate: {
            interval: 0,
          },
        }),
      ).rejects.toThrow('Expected to set number which great than 1 in `config.autoUpdate.interval`')
    })
  })

  describe('file not found', () => {
    it('should throw error when generating from a file that does not exists', async () => {
      await expect(
        generate({
          generator: [
            {
              input: 'http://localhost:3000/openapi.json',
              output: './src/api',
              template: () => ({ path: '' }),
            },
          ],
        }),
      ).rejects.toThrow('Cannot read file from http://localhost:3000/openapi.json')
    })
  })
})
