import type { Api, ApiMethod, GeneratorConfig, OpenAPIDocument, Parser, TemplateData } from '@/type'
import { defaultValueLoader, standardLoader } from '@/core/loader'
import getFrameworkTag from '@/functions/getFrameworkTag'
import { GeneratorHelper } from '@/helper'
import { OpenApiHelper } from '@/helper/document'
import { optimizeRefsMap } from '@/utils/openapi'
import { parseParameters, parseRequestBody, parseResponse, transformApiMethods } from './helper'

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
  }

  private async parseBaseInfo() {
    const generatorHelper = await GeneratorHelper.load(this.options.generatorConfig)
    const templateType = generatorHelper.getTemplateType(this.options.projectPath)
    const config = generatorHelper.getConfig()
    const templateConfig = await GeneratorHelper.getTemplateConfig(config.template)
    const { info, openapi } = this.document

    const templateData: TemplateData = {
      title: info.title,
      openapi,
      version: info.version,
      description: info.description,
      framework: getFrameworkTag(this.options.projectPath),
      baseUrl: this.document.servers?.[0]?.url || '',
      apis: [],
      tagedApis: [],
      components: [],
      type: templateType,
      config: templateConfig.config,
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
    const apiMethodArray = (await Promise.all(apiMethods.map(apiMethod => this.transformApiMethods(apiMethod)))).filter(
      apiMethod => !!apiMethod,
    )
    const refsMap = Object.fromEntries(this.refNameMap)
    const usedRefs = this.openApiHelper
      .saveApiMethods(apiMethodArray)
      .filterUsedReferences(Object.keys(refsMap))
    this.refNameMap = new Map<string, string>(Object.entries(
      optimizeRefsMap(refsMap, usedRefs),
    ));

    (await Promise.all(apiMethodArray.map(apiMethod => this.transformApis(apiMethod))))
      .flat()
      .forEach((api) => {
        this.parseApi(api, templateData)
      })
    templateData.components = [...new Set(this.schemasMap.values())]
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
      const { requestComment, requestName } = await parseRequestBody(
        operationObject.requestBody,
        {
          document: this.document,
          config: this.options.generatorConfig,
          schemasMap: this.schemasMap,
          refNameMap: this.refNameMap,
        },
      )
      const { responseComment, responseName } = await parseResponse(
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
        responseName,
        requestName,
        pathKey: `${tag}.${operationObject.operationId}`,
        queryParameters,
        queryParametersComment,
        pathParameters,
        pathParametersComment,
        responseComment,
        requestComment,
        defaultValue: '',
      }
      api.defaultValue = await defaultValueLoader.transformApi(api)
      apis.push(api)
    }
    return apis
  }

  private parseApi(api: Api, templateData: TemplateData) {
    let tagApis = templateData.tagedApis.find(item => item.tag === api.tag)
    if (!tagApis) {
      tagApis = {
        tag: api.tag,
        apis: [],
      }
      templateData.tagedApis.push(tagApis)
    }
    tagApis.apis.push(api)
  }
}

export const templateParser = new TemplateParser()
