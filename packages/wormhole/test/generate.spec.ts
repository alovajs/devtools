import type { Config, SchemaObject } from '@/type'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { generate } from '@/index'
import { createStrReg } from './util'

vi.mock('node:fs')
vi.mock('node:fs/promises')
const getSalt = () => `_${Math.random().toString(36).slice(2)}`
describe('generate API', () => {
  it('should throw error when necessary items are not specified', async () => {
    await expect(generate({} as any)).rejects.toThrow('No items found in the `config.generator`')
    await expect(
      generate({
        generator: [{} as any],
      }),
    ).rejects.toThrow('Field input is required in `config.generator`')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
          },
        ],
      } as any),
    ).rejects.toThrow('Field output is required in `config.generator`')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: '1243sadf',
          },
        ],
      }),
    ).rejects.toThrow('does not match variable specification')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf&*^^&%',
          },
        ],
      }),
    ).rejects.toThrow('does not match variable specification')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf__$$123',
          },
          {
            input: 'http://localhost:3000/openapi2.json',
            output: './src/api',
          },
        ],
      }),
    ).rejects.toThrow('output `./src/api` is repated')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf__$$123',
          },
          {
            input: 'http://localhost:3000/openapi2.json',
            output: './src/api2',
          },
        ],
      }),
    ).rejects.toThrow('Field global is required in `config.generator`')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf__$$123',
          },
          {
            input: 'http://localhost:3000/openapi2.json',
            output: './src/api2',
            global: 'asdf__$$123',
          },
        ],
      }),
    ).rejects.toThrow('global `asdf__$$123` is repated')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
          },
        ],
        autoUpdate: {
          interval: 'abc' as any,
        },
      }),
    ).rejects.toThrow('autoUpdate.interval must be a number')
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
          },
        ],
        autoUpdate: {
          interval: -1,
        },
      }),
    ).rejects.toThrow('Expected to set number which great than 1 in `config.autoUpdate.interval`')
  })

  it('should throw error when generating from a file that does not exists', async () => {
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
          },
        ],
      }),
    ).rejects.toThrow('Cannot read file from http://localhost:3000/openapi.json')
  })

  it('should generate code with a variant of openapi file formats', async () => {
    const outputDir = resolve(__dirname, './mock_output/openapi_301')
    const results = await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    expect(results).toStrictEqual([true])
    expect(await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()

    const outputDir2 = resolve(__dirname, './mock_output/swagger_2')
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/swagger_2.json'),
          output: outputDir2,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir2, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()

    const outputDir3 = resolve(__dirname, './mock_output/openapi_300')
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_300.yaml'),
          output: outputDir3,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir3, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir3, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir3, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir3, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()
  })

  it('shouldn\'t replace `index` file if it is generated', async () => {
    const outputDir = resolve(__dirname, './mock_output/openapi_301')
    const config: Config = {
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'ts',
        },
      ],
    }
    const indexOriginalContent = `beforeRequest: method => {}`
    const indexReplacingContent = `beforeRequest: method => { method.config.headers.token = '123' }`
    const globalsOriginalContent = `type UserMethodConfigMap = typeof $$userConfigMap;`
    const globalsReplacingContent = `type UserMethodConfigMap = number`
    const indexContent = () => fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')
    const globalsContent = () => fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')

    // generate first time
    await generate(config)
    await expect(indexContent()).resolves.toMatch(indexOriginalContent)
    await expect(globalsContent()).resolves.toMatch(globalsOriginalContent)

    // modify generated files
    await fs.writeFile(
      resolve(outputDir, 'index.ts'),
      (await indexContent()).replace(indexOriginalContent, indexReplacingContent),
    )
    await fs.writeFile(
      resolve(outputDir, 'globals.d.ts'),
      (await globalsContent()).replace(globalsOriginalContent, globalsReplacingContent),
    )
    // generate again
    await generate(config)
    // if `force` is false, it will not re-generate when openapi file is not changed
    await expect(indexContent()).resolves.toMatch(indexReplacingContent)
    await expect(globalsContent()).resolves.toMatch(globalsReplacingContent)

    // force generate even if openapi file is not changed
    // but only index.ts will keep modified content
    await generate(config, { force: true })
    // if `force` is false, it will not re-generate when openapi file is not changed
    await expect(indexContent()).resolves.toMatch(indexReplacingContent)
    await expect(globalsContent()).resolves.toMatch(globalsOriginalContent)
  })

  it('should generate code from an url', async () => {
    const outputDir = resolve(__dirname, `./mock_output/swagger_petstore${getSalt()}`)
    await generate({
      generator: [
        {
          input: 'https://generator3.swagger.io/openapi.json',
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()

    const outputDir2 = resolve(__dirname, `./mock_output/generator_file${getSalt()}`)
    await generate({
      generator: [
        {
          input: 'https://generator3.swagger.io',
          platform: 'swagger',
          output: outputDir2,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir2, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()

    const outputDir3 = resolve(__dirname, `./mock_output/generator_file${getSalt()}`)
    await generate({
      generator: [
        {
          input: 'https://generator3.swagger.io/v1.0/foo?test=1&bar=2#ccc',
          platform: 'swagger',
          output: outputDir3,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir3, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir3, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir3, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir3, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()
  })

  it('should generate target versioned code', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          version: 2,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()

    const outputDir2 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir2,
          version: 3,
          type: 'ts',
        },
      ],
    })
    expect(await fs.readFile(resolve(outputDir2, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'createApis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir2, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()
  })

  it('should generate the existing `mediaType` if the target `mediaType` is not matched', async () => {
    // default mediaType: application/json
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })

    let globalsDeclarationFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    expect(globalsDeclarationFile).toMatch(
      createStrReg(`generateBundle<
        Config extends Alova2MethodConfig<GenerationRequest> & {
          data: GenerationRequest;
        }
      >`),
    )
    expect(globalsDeclarationFile).toMatch(`: Alova2Method<string[], 'documentation.documentationLanguages', Config>;`)

    // custom mediaType: application/json
    const outputDir2 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir2,
          bodyMediaType: 'application/json',
          responseMediaType: 'application/json',
          type: 'ts',
        },
      ],
    })

    globalsDeclarationFile = await fs.readFile(resolve(outputDir2, 'globals.d.ts'), 'utf-8')
    expect(globalsDeclarationFile).toMatch(
      createStrReg(`generateBundle<
        Config extends Alova2MethodConfig<GenerationRequest> & {
          data: GenerationRequest;
        }
      >`),
    )
    expect(globalsDeclarationFile).toMatch(`: Alova2Method<string[], 'documentation.documentationLanguages', Config>;`)

    // custom mediaType: application/xml
    // but if there is not `application/xml` in the schema, it will be refer to the first mediaType in the schema, so here will still generate with mediaType `application/json`
    const outputDir3 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir3,
          bodyMediaType: 'application/xml',
          responseMediaType: 'application/xml',
          type: 'ts',
        },
      ],
    })

    globalsDeclarationFile = await fs.readFile(resolve(outputDir3, 'globals.d.ts'), 'utf-8')
    expect(globalsDeclarationFile).toMatch(
      createStrReg(`generateBundle<
        Config extends Alova2MethodConfig<GenerationRequest> & {
          data: GenerationRequest;
        }
      >`),
    )
    expect(globalsDeclarationFile).toMatch(`: Alova2Method<string[], 'documentation.documentationLanguages', Config>;`)
  })

  it('should generate correspoding `mediaType` parameters if matched target `mediaType`', async () => {
    const outputDir = resolve(__dirname, `./mock_output/multiple_media_type${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/multiple_media_type.yaml'),
          output: outputDir,
          bodyMediaType: 'application/xml',
          responseMediaType: 'application/xml',
          type: 'ts',
        },
      ],
    })

    const globalsDeclarationFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    expect(globalsDeclarationFile).toMatch(
      createStrReg(`pet24<
        Config extends Alova2MethodConfig<Tag> & {
          data: Category;
        }
      >(
        config: Config
      ): Alova2Method<Tag, 'pet.pet24', Config>;`),
    )
  })

  it('should auto detect generating module codes if not set `type`', async () => {
    // default type: auto
    // generate ts modules
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    await expect(fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).resolves.not.toBeUndefined()

    // auto: esm
    const packageJson = {
      name: 'test-pkg',
      type: undefined as string | undefined,
      version: '1.0.0',
      devDependencies: {},
    }
    const tempPkgFile = resolve(__dirname, './package.json')
    const { writeFileSync, unlinkSync } = await vi.importActual<typeof import('node:fs')>('node:fs')
    writeFileSync(tempPkgFile, JSON.stringify(packageJson))
    const outputDir2 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate(
      {
        generator: [
          {
            input: resolve(__dirname, './openapis/openapi_301.json'),
            output: outputDir2,
          },
        ],
      },
      {
        projectPath: __dirname,
      },
    )
    const fileContentEsm = await fs.readFile(resolve(outputDir2, 'createApis.js'), 'utf-8')
    expect(fileContentEsm).toMatch('export const createApis')

    // auto: cjs
    packageJson.type = 'commonjs'
    writeFileSync(tempPkgFile, JSON.stringify(packageJson))
    const outputDir3 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate(
      {
        generator: [
          {
            input: resolve(__dirname, './openapis/openapi_301.json'),
            output: outputDir3,
          },
        ],
      },
      {
        projectPath: __dirname,
      },
    )
    const fileContentCjs = await fs.readFile(resolve(outputDir3, 'createApis.js'), 'utf-8')
    expect(fileContentCjs).toMatch(
      createStrReg(`module.exports = {
  createApis,
  withConfigType,
  mountApis
};`),
    )

    unlinkSync(tempPkgFile)
  })

  it('should generate corresponding module codes dependent to `type`', async () => {
    // ts
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'typescript',
        },
      ],
    })
    await expect(fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).resolves.not.toBeUndefined()

    const outputDirTs = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDirTs,
          type: 'ts',
        },
      ],
    })
    await expect(fs.readFile(resolve(outputDirTs, 'createApis.ts'), 'utf-8')).resolves.not.toBeUndefined()

    // esm
    const outputDir2 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir2,
          type: 'module',
        },
      ],
    })
    const fileContentEsm = await fs.readFile(resolve(outputDir2, 'createApis.js'), 'utf-8')
    expect(fileContentEsm).toMatch('export const createApis')

    // cjs
    const outputDir3 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir3,
          type: 'commonjs',
        },
      ],
    })
    const fileContentCjs = await fs.readFile(resolve(outputDir3, 'createApis.js'), 'utf-8')
    expect(fileContentCjs).toMatch(
      createStrReg(`module.exports = {
  createApis,
  withConfigType,
  mountApis
};`),
    )
  })

  it('should set the right global variable name', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    const fileContent = await fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')
    expect(fileContent).toMatch('(globalThis as any).Apis = Apis;')

    const outputDir2 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir2,
          type: 'module',
          global: 'ApisEsm',
        },
      ],
    })
    const fileContentEsm = await fs.readFile(resolve(outputDir2, 'createApis.js'), 'utf-8')
    expect(fileContentEsm).toMatch('globalThis.ApisEsm = Apis;')

    const outputDir3 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    const outputDir4 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    const results = await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir3,
          type: 'commonjs',
          global: 'ApisCjs',
        },
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir4,
          type: 'module',
          global: 'ApisEsm2',
        },
      ],
    })
    expect(results).toStrictEqual([true, true])
    const fileContentCjs = await fs.readFile(resolve(outputDir3, 'createApis.js'), 'utf-8')
    expect(fileContentCjs).toMatch('globalThis.ApisCjs = Apis;')
    const fileContentEsm2 = await fs.readFile(resolve(outputDir4, 'createApis.js'), 'utf-8')
    expect(fileContentEsm2).toMatch('globalThis.ApisEsm2 = Apis;')
  })

  it('should set the right globalHost variable name', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          type: 'module',
          globalHost: 'globalHost',
        },
      ],
    })
    const fileContentEsm = await fs.readFile(resolve(outputDir, 'createApis.js'), 'utf-8')
    expect(fileContentEsm).toMatch('globalHost.Apis = Apis;')
    const outputDir3 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    const outputDir4 = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    const results = await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir3,
          type: 'commonjs',
          global: 'ApisCjs',
          globalHost: 'parentCjs',
        },
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir4,
          type: 'ts',
          global: 'ApisEsm',
          globalHost: 'globalThis ? globalThis : parentTs',
        },
      ],
    })
    expect(results).toStrictEqual([true, true])
    const fileContentCjs = await fs.readFile(resolve(outputDir3, 'createApis.js'), 'utf-8')
    expect(fileContentCjs).toMatch('parentCjs.ApisCjs = Apis;')
    const fileContentEsm2 = await fs.readFile(resolve(outputDir4, 'createApis.ts'), 'utf-8')
    expect(fileContentEsm2).toMatch('((globalThis ? globalThis : parentTs) as any).ApisEsm = Apis;')
  })

  it('should preprocess non-variable-specification characters', async () => {
    const outputDir = resolve(__dirname, `./mock_output/non_variable_specification_openapi${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/non_variable_specification_openapi.yaml'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    const indexFile = await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')
    expect(indexFile).toMatch('baseURL: \'\'')
    const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')
    expect(apiDefinitionsFile).toMatch('\'_24pet.pet24\': [\'POST\', \'/pet\']') // non-variable specification tag
    expect(apiDefinitionsFile).toMatch('pet.put_pet\': [\'PUT\', \'/pet\']') // `operationId` is not defined
  })

  it('should classify the apis that have no tags to `general` tag', async () => {
    const outputDir = resolve(__dirname, `./mock_output/tag_general_openapi${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/tag_general_openapi.yaml'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')
    expect(apiDefinitionsFile).toMatch('\'general.addPet\': [\'POST\', \'/pet\']')
    expect(apiDefinitionsFile).toMatch('\'general.delPet\': [\'DELETE\', \'/pet\']')
    expect(apiDefinitionsFile).toMatch('\'general.addPet\': [\'POST\', \'/pet\']')
  })

  it('should generate the same api with different tag when has multiple tags', async () => {
    const outputDir = resolve(__dirname, `./mock_output/multiple_tag_openapi${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/multiple_tag_openapi.yaml'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')
    expect(apiDefinitionsFile).toMatch('\'pet.addPet\': [\'POST\', \'/pet\']')
    expect(apiDefinitionsFile).toMatch('\'store.addPet\': [\'POST\', \'/pet\']')
    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    expect(globalsFile).toMatch('Alova2Method<Pet, \'pet.addPet\', Config>')
    expect(globalsFile).toMatch('Alova2Method<Pet, \'store.addPet\', Config>')
  })

  it('should stop endless loop when encounter circular reference in component', async () => {
    const outputDir = resolve(__dirname, `./mock_output/endless_loop_openapi${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/endless_loop_openapi.yaml'),
          output: outputDir,
          type: 'ts',
          handleApi(apiDescriptor) {
            if (apiDescriptor.responses?.properties) {
              const testObject: SchemaObject = {
                type: 'object',
                properties: {
                  foo: {
                    type: 'object',
                    properties: {} as Record<string, any>,
                  },
                },
              }
              const foo = testObject.properties!.foo as SchemaObject
              foo.properties!.bar = testObject
              apiDescriptor.responses.properties.test = testObject
            }
            return apiDescriptor
          },
        },
      ],
    })
    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    expect(globalsFile).toMatch(
      createStrReg(`type Response = {
       *   id?: number
       *   // [title] Pet category
       *   // A category for a pet
       *   category?: {
       *     id?: number
       *     name?: string
       *     // [title] Pet Tag
       *     // A tag for a pet
       *     tag?: {
       *       id?: number
       *       name?: string
       *       // [cycle] $
       *       pet?: Pet1
       *     }
       *   }
       *   name: string
       *   // [items] start
       *   // [items] end
       *   photoUrls: string[]
       *   // [items] start
       *   // [title] Pet Tag
       *   // A tag for a pet
       *   // [items] end
       *   tags?: Array<{
       *     id?: number
       *     name?: string
       *     // [cycle] $
       *     pet?: Pet1
       *   }>
       *   // pet status in the store
       *   // [deprecated]
       *   status?: 'available' | 'pending' | 'sold'
       *   test?: {
       *     foo?: {
       *       bar?: {
       *         foo?: {
       *           // [cycle] $.test.foo.bar
       *           bar?: Fifbcibcd
       *         }
       *       }
       *     }
       *   }
       * }`),
    )
  })

  it('should automatically convert object that contains `Blob` to `FormData`', async () => {
    const outputDir = resolve(__dirname, `./mock_output/file_upload_openapi${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/file_upload_openapi.yaml'),
          output: outputDir,
          type: 'ts',
        },
      ],
    })
    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    expect(globalsFile).toMatch('file: Blob')
  })

  it('should generate the right types according to `$ref` type', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
        },
      ],
    })

    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    expect(globalsFile).toMatch(
      createStrReg(`generateBundle<
        Config extends Alova2MethodConfig<GenerationRequest> & {
          data: GenerationRequest;
        }
      >(
        config: Config
      ): Alova2Method<GenerationRequest, 'config.generateBundle', Config>;`),
    )
    expect(globalsFile).toMatch(
      createStrReg(`clientLanguages<
        Config extends Alova2MethodConfig<string[]> & {
          params: {
            /**
             * generator version used by codegen engine
             */
            version?: 'V2' | 'V3';
            /**
             * flag to only return languages of type \`client\`
             */
            clientOnly?: boolean;
          };
        }
      >`),
    )
  })

  it('should `handleApi` handler change all descriptors', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          handleApi: (apiDescriptor) => {
            if (apiDescriptor.url === '/documentation') {
              apiDescriptor.responses = {
                type: 'object',
                properties: {
                  attr1: {
                    type: 'string',
                  },
                  attr2: {
                    type: 'number',
                  },
                },
              }
              return apiDescriptor
            }
            if (apiDescriptor.url === '/clients') {
              apiDescriptor.operationId = 'customClients'
              apiDescriptor.parameters?.push(
                {
                  name: 'token',
                  in: 'path',
                  description: 'client token',
                  schema: {
                    type: 'string',
                  },
                },
                {
                  name: 'id',
                  in: 'query',
                  description: 'client id',
                  required: true,
                  schema: {
                    type: 'number',
                  },
                },
              )
              apiDescriptor.url += '/suffix'
              return apiDescriptor
            }
            if (apiDescriptor.url === '/model' && apiDescriptor.method.toUpperCase() === 'POST') {
              apiDescriptor.tags = ['clients']
              apiDescriptor.requestBody = {
                type: 'object',
                properties: {
                  attr1: {
                    type: 'string',
                  },
                },
              }
              return apiDescriptor
            }
          },
          type: 'ts',
        },
      ],
    })
    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    // check only generate specified apis
    expect(globalsFile).toMatch(
      createStrReg(`documentationLanguages<
        Config extends Alova2MethodConfig<{
          attr1?: string;
          attr2?: number;
        }>`),
    )
    expect(globalsFile).toMatch(
      createStrReg(`customClients<
        Config extends Alova2MethodConfig<string[]> & {
          pathParams: {
            /**
             * client token
             */
            token?: string;
          };
          params: {
            /**
             * generator version used by codegen engine
             */
            version?: 'V2' | 'V3';
            /**
             * flag to only return languages of type \`client\`
             */
            clientOnly?: boolean;
            /**
             * client id
             */
            id: number;
          };
        }
      >`),
    )
    expect(globalsFile).toMatch(
      createStrReg(`generateBundle<
        Config extends Alova2MethodConfig<GenerationRequest> & {
          data: {
            attr1?: string;
          };
        }
      >`),
    )
    expect(globalsFile).not.toMatch('serverLanguages')
    expect(globalsFile).not.toMatch('listOptions')
    expect(globalsFile).not.toMatch('generateFromURL')

    const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')
    expect(apiDefinitionsFile).toMatch(
      createStrReg(`export default {
  'clients.customClients': ['GET', '/clients/suffix'],
  'documentation.customClients': ['GET', '/clients/suffix'],
  'documentation.documentationLanguages': ['GET', '/documentation'],
  'clients.generateBundle': ['POST', '/model']
};`),
    )
  })

  it('should only effect component type of modified descriptor when this component is refered by multiple descriptor', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_300${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_300.yaml'),
          output: outputDir,
          handleApi: (apiDescriptor) => {
            if (apiDescriptor.url === '/pet') {
              if (apiDescriptor.method.toUpperCase() === 'POST' && apiDescriptor.responses?.properties) {
                apiDescriptor.responses.properties.customAttr = {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                }
              }
              else if (apiDescriptor.method.toUpperCase() === 'PUT' && apiDescriptor.responses?.properties) {
                apiDescriptor.responses.properties.customAttr2 = {
                  type: 'string',
                  description: 'custom test attr 2',
                }
              }
              return apiDescriptor
            }
            return apiDescriptor
          },
        },
      ],
    })

    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    // generate separated `Pet1` from `Pet`
    expect(globalsFile).toMatch(
      createStrReg(`pet24<
        Config extends Alova2MethodConfig<Pet1> & {
          data: Pet;
        }
      >(
        config: Config
      ): Alova2Method<Pet1, 'tag.pet24', Config>;`),
    )
    // generate separated `Pet2` from `Pet`
    expect(globalsFile).toMatch(
      createStrReg(`updatePet<
        Config extends Alova2MethodConfig<Pet2> & {
          data: Pet;
        }
      >(
        config: Config
      ): Alova2Method<Pet2, 'pet.updatePet', Config>;`),
    )
    // the unmodified api still reference `Pet`
    expect(globalsFile).toMatch(
      createStrReg(`findPetsByStatus<
        Config extends Alova2MethodConfig<Pet[]> & {
          params: {
            /**
             * Status values that need to be considered for filter
             * @deprecated
             */
            status: ('available' | 'pending' | 'sold')[];
          };
        }
      >(
        config: Config
      ): Alova2Method<Pet[], 'pet.findPetsByStatus', Config>;`),
    )
  })

  it('the response data type starting with 2xx in the openapi file should be used as the generation source', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_success_key${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_success_key.json'),
          output: outputDir,
        },
      ],
    })

    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')
    // generate 200 `Blob` from Response
    expect(globalsFile).toMatch(
      createStrReg(`
       * **Response**
       * \`\`\`ts
       * type Response = Blob
       * \`\`\`
       */
      generateCase1<
        Config extends Alova2MethodConfig<Blob> & {
          params: {
            codegenOptionsURL: string;
          };
        }
      >(
        config: Config
      ): Alova2Method<Blob, 'clients.generateCase1', Config>;`),
    )
    // generate 201 `string` from Response
    expect(globalsFile).toMatch(
      createStrReg(`
       * **Response**
       * \`\`\`ts
       * type Response = string
       * \`\`\`
       */
      generateCase2<
        Config extends Alova2MethodConfig<string> & {
          params: {
            codegenOptionsURL: string;
          };
        }
      >(
        config: Config
      ): Alova2Method<string, 'clients.generateCase2', Config>;`),
    )
    // generate 299 `string[]` from Response
    expect(globalsFile).toMatch(
      createStrReg(`
       * **Response**
       * \`\`\`ts
       * type Response = string[]
       * \`\`\`
       */
      generateCase3<
        Config extends Alova2MethodConfig<string[]> & {
          params: {
            codegenOptionsURL: string;
          };
        }
      >(
        config: Config
      ): Alova2Method<string[], 'clients.generateCase3', Config>;`),
    )
    // generate 200 `string[]` from Response 200、201、299
    expect(globalsFile).toMatch(
      createStrReg(`
       * **Response**
       * \`\`\`ts
       * type Response = string[]
       * \`\`\`
       */
      generateCase4<
        Config extends Alova2MethodConfig<string[]> & {
          params: {
            codegenOptionsURL: string;
          };
        }
      >(
        config: Config
      ): Alova2Method<string[], 'clients.generateCase4', Config>;`),
    )
  })

  it('should handle nullable properties in OpenAPI 3.0', async () => {
    const outputDir = resolve(__dirname, `./mock_output/nullable_openapi${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/nullable_openapi.yaml'),
          output: outputDir,
        },
      ],
    })

    const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')

    // 检查生成的类型定义是否正确处理了 nullable 属性
    expect(globalsFile).toMatch(
      createStrReg(`interface Pet {
  /**
   * Pet ID
   * ---
   */
  id?: number | null;
  /**
   * Pet Name
   * ---
   */
  name: string;
  /**
   * Pet Status
   * ---
   */
  status?: ('available' | 'pending' | 'sold') | null;
  /**
   * Pet Tags
   * ---
   */
  tags?: Tag[] | null;
  }`),
    )
  })

  it('should generate api files according to the fileNameCase config', async () => {
    const outputDir = resolve(__dirname, `./mock_output/openapi_301${getSalt()}`)
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          fileNameCase: 'kebabCase',
          type: 'ts',
        },
      ],
    })

    expect(await fs.readFile(resolve(outputDir, 'api-definitions.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'create-apis.ts'), 'utf-8')).toMatchSnapshot()
    expect(await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')).toMatchSnapshot()

    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          fileNameCase: 'pascalCase',
          type: 'ts',
        },
      ],
    })

    expect(await fs.readFile(resolve(outputDir, 'CreateApis.ts'), 'utf-8')).toMatchSnapshot()
  })
})
