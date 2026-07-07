import type { Api, ApiMethod, GeneratorConfig, OpenAPIDocument, Parser, SchemaObject, TemplateData } from '@/type'
import { cpus } from 'node:os'
import path from 'node:path'
import { callingCodeLoader, standardLoader } from '@/core/loader'
import { pickPoolSize } from '@/core/WorkerPool'
import { PoolManager } from '@/core/workerPool/poolManager'
import getFrameworkTag from '@/functions/getFrameworkTag'
import { GeneratorHelper } from '@/helper'
import { OpenApiHelper } from '@/helper/document'
import { getResponseSuccessKey, optimizeRefsMap, parseReference } from '@/utils/openapi'
import { getContentKey, parseParameters, parseRequestBody, parseResponse, transformApiMethods } from './helper'

/** M2-B4: 轻量并发 limiter，无额外依赖 */
async function pMap<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let idx = 0
  async function worker(): Promise<void> {
    while (idx < items.length) {
      const i = idx++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

/** 根据 CPU 核数自动计算合理并发上限 */
function autoConcurrency(): number {
  const cpuCount = Math.max(1, cpus().length)
  return Math.min(64, Math.max(8, cpuCount * 4))
}

export interface TemplateParserOptions {
  generatorConfig: GeneratorConfig
  projectPath: string // Project address
}

export class TemplateParser implements Parser<OpenAPIDocument, TemplateData, TemplateParserOptions> {
  name = 'templateParser'
  private schemasMap = new Map<string, string>()
  private operationIdSet = new Set<string>()
  private pathMap: Array<[string, any]> = []
  private refNameMap = new Map<string, string>()
  /** M1-A4: 用 Map 索引替代 tagedApis.find() 线性查找，O(n·t) → O(n+t) */
  private tagMap = new Map<string, { tagName: string, apis: Api[] }>()
  private document: OpenAPIDocument
  private options: TemplateParserOptions
  private openApiHelper = new OpenApiHelper()

  async parse(document: OpenAPIDocument, options: TemplateParserOptions): Promise<TemplateData> {
    this.document = document
    this.options = options
    const templateData = await this.parseBaseInfo()
    await this.parseApiMethods(this.openApiHelper.load(document).getApiMethods(), templateData)
    this.clear()
    return templateData
  }

  private clear() {
    this.schemasMap.clear()
    this.operationIdSet.clear()
    this.pathMap.splice(0, this.pathMap.length)
    this.refNameMap.clear()
    this.tagMap.clear()
  }

  private async parseBaseInfo() {
    const generatorHelper = await GeneratorHelper.load(this.options.generatorConfig)
    const templateType = await generatorHelper.getTemplateType(this.options.projectPath)
    const { info, openapi } = this.document

    const templateData: TemplateData = {
      title: info.title,
      openapi,
      version: info.version,
      description: info.description,
      contact: info.contact,
      framework: await getFrameworkTag(this.options.projectPath),
      baseUrl: this.document.servers?.[0]?.url || '',
      allApis: [],
      tagedApis: [],
      components: [],
      componentNames: [],
      type: templateType,
      config: {},
    }
    return templateData
  }

  private async transformApiMethods(apiMethod: ApiMethod) {
    const { url, method, operationObject } = apiMethod
    operationObject.operationId = standardLoader.transformOperationId(operationObject, {
      url,
      method,
      map: this.operationIdSet,
    })
    operationObject.tags = standardLoader.transformTags(operationObject.tags)
    const result = await transformApiMethods(apiMethod, {
      document: this.document,
      refNameMap: this.refNameMap,
      config: this.options.generatorConfig,
      map: this.pathMap,
    })
    return result
  }

  private async parseApiMethods(apiMethods: ApiMethod[], templateData: TemplateData) {
    const concurrency = autoConcurrency()
    const apiMethodArray = (await pMap(apiMethods, apiMethod => this.transformApiMethods(apiMethod), concurrency)).filter(
      apiMethod => !!apiMethod,
    )
    const refsMap = Object.fromEntries(this.refNameMap)
    const usedRefs = this.openApiHelper
      .saveApiMethods(apiMethodArray)
      .filterUsedReferences(Object.keys(refsMap))
    this.refNameMap = new Map<string, string>(Object.entries(
      optimizeRefsMap(refsMap, usedRefs),
    ))

    // M4-C1: Pre-process schemas via worker pool for parallel schema→TS conversion
    const poolSize = pickPoolSize(apiMethodArray.length)
    if (poolSize > 0) {
      const tasks = this.collectSchemaTasks(apiMethodArray)
      if (tasks.length > 0) {
        // .js for production, .ts for vitest/dev; existsSync may fail in mocked fs
        const jsWp = path.resolve(__dirname, '../../workerPool/worker.js')
        const tsWp = path.resolve(__dirname, '../../workerPool/worker.ts')
        const { existsSync: fex } = await import('node:fs')
        const workerScript = fex(jsWp) ? jsWp : tsWp

        // P2: Reuse worker pool via PoolManager singleton — avoids create/destroy overhead across repeated generate() calls
        const pool = PoolManager.getInstance().get<{ key: string, schema: SchemaObject }, { key: string, result: string }>({
          key: `schemaWorker_${this.options.projectPath}`,
          workerScript,
          sharedContext: {
            document: this.document,
            config: {
              defaultRequire: this.options.generatorConfig.defaultRequire,
              externalTypes: this.options.generatorConfig.externalTypes,
            },
            refNameMapEntries: [...this.refNameMap.entries()],
          },
          poolSize,
        })
        const results = await pool.processBatch(tasks)
        for (const { key, result } of results) {
          this.schemasMap.set(key, result)
        }
      }
    }

    (await pMap(apiMethodArray, apiMethod => this.transformApis(apiMethod), concurrency))
      .flat()
      .forEach((api) => {
        this.parseApi(api, templateData)
      })
    templateData.components = [...new Set(this.schemasMap.values())]
    templateData.componentNames = [...this.schemasMap.keys()]
    // 按名称字典序排序，确保输出顺序确定性（避免并发场景下 Map 插入顺序漂移）
    const sorted = [...this.schemasMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    templateData.componentNames = sorted.map(([k]) => k)
    templateData.components = sorted.map(([, v]) => v)
  }

  /**
   * M4-C1: Collect all unique schema objects from API methods for batch processing.
   * Mirrors the schema construction logic from parseParameters/parseRequestBody/parseResponse
   * but without calling getTsStr — only collects the SchemaObjects for deferred processing.
   */
  private collectSchemaTasks(
    apiMethodArray: ApiMethod[],
  ): Array<{ key: string, schema: SchemaObject }> {
    const tasks: Array<{ key: string, schema: SchemaObject }> = []
    const seen = new Set<string>()
    const genConfig = this.options.generatorConfig

    function add(schema: any): boolean {
      if (!schema || typeof schema !== 'object')
        return false
      const hash = JSON.stringify(schema)
      if (seen.has(hash))
        return false
      seen.add(hash)
      const key = `schema_${seen.size}`
      tasks.push({ key, schema })
      return true
    }

    for (const apiMethod of apiMethodArray) {
      const { operationObject } = apiMethod

      // Collect parameter schemas (mirroring parseParameters)
      if (operationObject.parameters) {
        const pathSchema: any = { type: 'object', properties: {}, required: [] }
        const querySchema: any = { type: 'object', properties: {}, required: [] }
        for (const refParam of operationObject.parameters) {
          const param = parseReference(refParam, this.document)
          if (param.in === 'path') {
            const target = pathSchema
            if (param.required)
              target.required.push(param.name)
            target.properties[param.name] = {
              ...param.schema,
              description: param.description || '',
              deprecated: !!param.deprecated,
            }
          }
          else if (param.in === 'query') {
            const target = querySchema
            if (param.required)
              target.required.push(param.name)
            target.properties[param.name] = {
              ...param.schema,
              description: param.description || '',
              deprecated: !!param.deprecated,
            }
          }
        }
        if (Object.keys(pathSchema.properties).length)
          add(pathSchema)
        if (Object.keys(querySchema.properties).length)
          add(querySchema)
      }

      // Collect request body schema (mirroring parseRequestBody)
      if (operationObject.requestBody) {
        const rb = parseReference(operationObject.requestBody, this.document, true)
        const bodyKey = getContentKey(rb.content, genConfig.bodyMediaType)
        const schema = (rb as any).content?.[bodyKey]?.schema
        add(schema)
      }

      // Collect response schema (mirroring parseResponse)
      if (operationObject.responses) {
        const successKey = getResponseSuccessKey(operationObject.responses)
        const resp = parseReference(operationObject.responses[successKey], this.document)
        if (resp) {
          const respKey = getContentKey(resp.content, genConfig.responseMediaType)
          const schema = (resp as any).content?.[respKey]?.schema
          add(schema)
        }
      }
    }
    return tasks
  }

  private async transformApis(apiMethod: ApiMethod) {
    const { method, url: path, operationObject } = apiMethod
    const apis: Api[] = []
    const tags = operationObject.tags ?? []
    for (const tag of tags) {
      const { queryParameters, queryParametersComment, pathParameters, pathParametersComment } = await parseParameters(
        operationObject.parameters,
        {
          document: this.document,
          config: this.options.generatorConfig,
          schemasMap: this.schemasMap,
          refNameMap: this.refNameMap,
        },
      )
      const { requestBodyComment, requestBody } = await parseRequestBody(
        operationObject.requestBody,
        {
          document: this.document,
          config: this.options.generatorConfig,
          schemasMap: this.schemasMap,
          refNameMap: this.refNameMap,
        },
      )
      const { responseComment, response } = await parseResponse(
        operationObject.responses,
        {
          document: this.document,
          config: this.options.generatorConfig,
          schemasMap: this.schemasMap,
          refNameMap: this.refNameMap,
        },
      )
      const api: Api = {
        tag,
        method: method.toUpperCase(),
        summary: operationObject.summary?.replace(/\n/g, '') ?? '',
        path,
        name: operationObject.operationId ?? '',
        response,
        requestBody,
        queryParameters,
        queryParametersComment,
        pathParameters,
        pathParametersComment,
        responseComment,
        requestBodyComment,
        callingCode: '',
      }
      api.callingCode = await callingCodeLoader.transformApi(api)
      apis.push(api)
    }
    return apis
  }

  private parseApi(api: Api, templateData: TemplateData) {
    templateData.allApis.push(api)
    let tagApis = this.tagMap.get(api.tag)
    if (!tagApis) {
      tagApis = {
        tagName: api.tag,
        apis: [],
      }
      this.tagMap.set(api.tag, tagApis)
      templateData.tagedApis.push(tagApis)
    }
    tagApis.apis.push(api)
  }
}

export const templateParser = new TemplateParser()
