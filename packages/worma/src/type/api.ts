import type { TemplateType } from './base'
import type { OpenAPIDocument, OperationObject, Parameter, SchemaObject } from './openapi'

export enum HttpMethod {
  GET = 'get',
  PUT = 'put',
  POST = 'post',
  DELETE = 'delete',
  OPTIONS = 'options',
  HEAD = 'head',
  PATCH = 'patch',
  TRACE = 'trace',
}

export interface Api {
  tag: string
  method: string
  summary: string
  path: string
  pathParameters: string
  queryParameters: string
  pathParametersComment?: string
  queryParametersComment?: string
  responseComment?: string
  requestBodyComment?: string
  name: string
  response: string
  requestBody?: string
  defaultValue?: string
  pathKey: string
  /** Global namespace name (e.g. 'Apis') for globals template mode */
  global?: string
}
export interface ApiMethod {
  url: string
  method: string
  operationObject: OperationObject
}
export interface ApiDoc {
  apis: Api[]
  tagName: string
}
export type ApiDescriptor = Omit<OperationObject, 'requestBody' | 'parameters' | 'responses'> & {
  url: string
  method: string
  parameters?: Parameter[]
  refNameMap?: Record<string, string>
  requestBody?: SchemaObject
  responses?: SchemaObject
}
export interface ApiPath {
  key: string
  method: string
  path: string
}
export interface TemplateData {
  title: OpenAPIDocument['info']['title']
  openapi: OpenAPIDocument['openapi']
  version: OpenAPIDocument['info']['version']
  description: OpenAPIDocument['info']['description']
  contact: OpenAPIDocument['info']['contact']
  /** Framework tag: vue | react | svelte | solid-js | nuxt */
  framework?: string
  defaultKey?: boolean
  baseUrl: string
  /** Schema/Component definitions */
  components: string[]
  /** Names of all generated component schemas (keys of schemasMap) */
  componentNames: string[]
  /** All apis array */
  allApis: Api[]
  /** Apis grouped by tag */
  tagedApis: ApiDoc[]
  type: TemplateType
  /** Config passed from template configuration */
  config: Record<string, any>
}

/**
 * Standardized cache data for VSCode extension
 * Used for rendering sidebar API tree and quick search
 */
export interface CacheData {
  path: string
  /** Server name displayed in sidebar */
  serverName?: string
  /** All APIs as a flat array */
  apis: Api[]
}
