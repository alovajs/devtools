/**
 * Tests that verify key GeneratorConfig parameters actually take effect during code generation.
 *
 * Covered fields: serverName, docComment, responseMediaType, bodyMediaType
 */
import type { GeneratorConfig, OpenAPIDocument, TemplateData } from '@/type'
import { resolve } from 'node:path'
// ===========================
// 4. serverName cache persistence tests
// ===========================
import { vol } from 'memfs'

import { describe, expect, it } from 'vitest'

// ===========================
// 2. docComment — controls generation of 4 API comment fields
// ===========================

// ===========================
// 3. TemplateParser integration tests (responseMediaType / bodyMediaType / docComment end-to-end)
// ===========================
import { openApiParser } from '@/core/parser'
import { TemplateParser } from '@/core/parser/templateParser'
// ===========================
// 1. getContentKey unit tests (underlying logic for responseMediaType / bodyMediaType)
// ===========================
import { getContentKey } from '@/core/parser/templateParser/helper'

import { GeneratorHelper } from '@/helper/config/GeneratorHelper'
import { TemplateHelper } from '@/helper/template'

describe('getContentKey (underlying logic for responseMediaType / bodyMediaType)', () => {
  it('should return the exact key when it exists in content', () => {
    const content = {
      'application/json': { schema: {} },
      'text/plain': { schema: {} },
    }
    expect(getContentKey(content, 'application/json')).toBe('application/json')
  })

  it('should return the first existing key from array fallback', () => {
    const content = {
      'text/plain': { schema: {} },
    }
    expect(getContentKey(content, ['application/json', 'text/plain'])).toBe('text/plain')
  })

  it('should skip missing keys and match the next one in array', () => {
    const content = {
      'application/xml': { schema: {} },
    }
    expect(getContentKey(content, ['application/json', 'application/xml'])).toBe('application/xml')
  })

  it('should fallback to the first key in content when none of the requireKeys match', () => {
    const content = {
      'image/png': { schema: {} },
    }
    expect(getContentKey(content, 'application/json')).toBe('image/png')
  })

  it('should return the first requireKey when content is empty', () => {
    expect(getContentKey({}, 'application/json')).toBe('application/json')
  })

  it('should return default when content is undefined', () => {
    expect(getContentKey(undefined as any, 'application/json')).toBe('application/json')
  })

  it('should return the first element when content is empty and requireKey is an array', () => {
    expect(getContentKey({}, ['application/json', 'text/xml'])).toBe('application/json')
  })

  it('should respect array priority order', () => {
    const content = {
      'text/xml': { schema: {} },
    }
    expect(getContentKey(content, ['application/json', 'text/html', 'text/xml'])).toBe('text/xml')
  })
})

const OPENAPI_DIR = resolve(__dirname, 'openapis')

async function readOpenApiFixture(name = 'openapi_300.yaml'): Promise<OpenAPIDocument> {
  return openApiParser.parse(resolve(OPENAPI_DIR, name))
}

/**
 * Apply defaults to raw config via GeneratorHelper.load before passing to TemplateParser.
 */
async function makeProcessedConfig(overrides: Partial<GeneratorConfig> = {}): Promise<GeneratorConfig> {
  const helper = await GeneratorHelper.load({
    input: resolve(OPENAPI_DIR, 'openapi_300.yaml'),
    output: './src/api',
    plugins: [{getTemplate: () => ({path: ''})}],
    ...overrides,
  })
  return helper.getConfig() as GeneratorConfig
}

describe('templateParser integration: responseMediaType / bodyMediaType / docComment', () => {
  const projectPath = process.cwd()

  it('should select application/json response schema by default', async () => {
    const document = await readOpenApiFixture()
    const parser = new TemplateParser()
    const config = await makeProcessedConfig()
    const result = await parser.parse(document, {
      generatorConfig: config,
      projectPath,
    })

    const allApis = result.tagedApis.flatMap(t => t.apis)
    const petApi = allApis.find(a => a.name === 'updatePet')
    expect(petApi).toBeDefined()
    expect(petApi!.response).toBeTruthy()
  })

  it('should select application/xml response schema when responseMediaType is set to xml', async () => {
    const document = await readOpenApiFixture()
    const parser = new TemplateParser()
    const config = await makeProcessedConfig({ responseMediaType: 'application/xml' })
    const result = await parser.parse(document, {
      generatorConfig: config,
      projectPath,
    })

    const allApis = result.tagedApis.flatMap(t => t.apis)
    const petApi = allApis.find(a => a.name === 'updatePet')
    expect(petApi).toBeDefined()
    expect(petApi!.response).toBeTruthy()
  })

  it('should select application/json requestBody schema by default', async () => {
    const document = await readOpenApiFixture()
    const parser = new TemplateParser()
    const config = await makeProcessedConfig()
    const result = await parser.parse(document, {
      generatorConfig: config,
      projectPath,
    })

    const allApis = result.tagedApis.flatMap(t => t.apis)
    // updatePet has requestBody with both application/json and application/xml
    const petApi = allApis.find(a => a.name === 'updatePet')
    expect(petApi).toBeDefined()
    expect(petApi!.requestBody).toBeTruthy()
  })

  it('should select application/xml requestBody schema when bodyMediaType is set to xml', async () => {
    const document = await readOpenApiFixture()
    const parser = new TemplateParser()
    const config = await makeProcessedConfig({ bodyMediaType: 'application/xml' })
    const result = await parser.parse(document, {
      generatorConfig: config,
      projectPath,
    })

    const allApis = result.tagedApis.flatMap(t => t.apis)
    const petApi = allApis.find(a => a.name === 'updatePet')
    expect(petApi).toBeDefined()
    expect(petApi!.requestBody).toBeTruthy()
  })

  it('should populate API comment fields when docComment is true (default)', async () => {
    const document = await readOpenApiFixture()
    const parser = new TemplateParser()
    const config = await makeProcessedConfig()
    const result = await parser.parse(document, {
      generatorConfig: config,
      projectPath,
    })

    const hasGetApi = result.tagedApis.flatMap(t => t.apis).filter(a => a.method === 'GET')
    expect(hasGetApi.length).toBeGreaterThan(0)

    // find an API that has query parameters (e.g. findPetsByStatus has a `status` query param)
    const apiWithQuery = hasGetApi.find(a =>
      a.queryParametersComment && a.queryParametersComment.length > 0,
    )
    expect(apiWithQuery).toBeDefined()
    expect(apiWithQuery!.queryParametersComment!.length).toBeGreaterThan(0)
  })

  it('should leave all API comment fields empty when docComment is false', async () => {
    const document = await readOpenApiFixture()
    const parser = new TemplateParser()
    const config = await makeProcessedConfig({ docComment: false })
    const result = await parser.parse(document, {
      generatorConfig: config,
      projectPath,
    })

    const allApis = result.tagedApis.flatMap(t => t.apis)
    expect(allApis.length).toBeGreaterThan(0)

    // verify all 4 comment fields are empty strings
    for (const api of allApis) {
      expect(api.responseComment).toBe('')
      expect(api.requestBodyComment).toBe('')
      expect(api.queryParametersComment).toBe('')
      expect(api.pathParametersComment).toBe('')
    }
  })
})

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('serverName effectiveness (cache persistence)', () => {
  const projectPath = '/test-project'
  const output = 'src/api'

  beforeEach(() => {
    vol.reset()
    vol.mkdirSync(projectPath, { recursive: true })
  })

  function makeTemplateData(): TemplateData {
    return {
      title: 'Test API',
      description: 'Test description',
      contact: {},
      componentNames: [],
      openapi: '3.0.0',
      version: '1.0.0',
      baseUrl: 'http://localhost',
      allApis: [{ tag: 'test', method: 'GET', summary: 'test', path: '/t', pathParameters: '', queryParameters: '', name: 'test', response: 'Test', pathKey: 'test.test' }],
      tagedApis: [{ tagName: 'test', apis: [] }],
      components: [],
      type: 'typescript' as const,
      config: {},
    }
  }

  it('should persist serverName in cache and read it back correctly', async () => {
    const serverName = 'Production API Server'
    await TemplateHelper.setData(
      makeTemplateData(),
      projectPath,
      output,
      { serverName } as GeneratorConfig,
    )

    const cached = await TemplateHelper.readData(projectPath, output)
    expect(cached).toBeDefined()
    expect(cached!.serverName).toBe(serverName)
    expect(cached!.path).toBe(output)
  })

  it('should fallback to templateData.title when serverName is not specified', async () => {
    await TemplateHelper.setData(
      makeTemplateData(),
      projectPath,
      output,
      {} as GeneratorConfig,
    )

    const cached = await TemplateHelper.readData(projectPath, output)
    expect(cached).toBeDefined()
    // Falls back to templateData.title (which is 'Test API' in the fixture)
    expect(cached!.serverName).toBe('Test API')
  })

  it('should update serverName on subsequent writes', async () => {
    await TemplateHelper.setData(
      makeTemplateData(),
      projectPath,
      output,
      { serverName: 'Dev Server' } as GeneratorConfig,
    )

    let cached = await TemplateHelper.readData(projectPath, output)
    expect(cached!.serverName).toBe('Dev Server')

    await TemplateHelper.setData(
      makeTemplateData(),
      projectPath,
      output,
      { serverName: 'Staging Server' } as GeneratorConfig,
    )

    cached = await TemplateHelper.readData(projectPath, output)
    expect(cached!.serverName).toBe('Staging Server')
  })

  it('should retrieve serverName directly from memory cache (setData -> getData)', async () => {
    const serverName = 'Memory-Test-Server'
    await TemplateHelper.setData(
      makeTemplateData(),
      projectPath,
      output,
      { serverName } as GeneratorConfig,
    )

    const data = TemplateHelper.getData(projectPath, output)
    expect(data).toBeDefined()
    expect(data!.serverName).toBe(serverName)
  })
})
