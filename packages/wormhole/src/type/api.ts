import type { AlovaVersion, ModuleType, TemplateType } from './base'
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
  requestComment?: string
  name: string
  global: string
  responseName: string
  requestName?: string
  defaultValue?: string
  pathKey: string
}
export interface ApiMethod {
  url: string
  method: string
  operationObject: OperationObject
}
export interface ApiDoc {
  apis: Api[]
  tag: string
}
export type ApiDescriptor = Omit<OperationObject, 'requestBody' | 'parameters' | 'responses'> & {
  url: string
  method: string
  parameters?: Parameter[]
  requestBody?: SchemaObject
  responses?: SchemaObject
}
export interface ApiPath {
  key: string
  method: string
  path: string
}
export interface TemplateData extends Omit<OpenAPIDocument, ''> {
  // Define template data types
  // ...

  vue?: boolean
  react?: boolean
  moduleType?: ModuleType
  defaultKey?: boolean
  baseUrl: string
  pathsArr: ApiPath[]
  schemas?: string[]
  pathApis: ApiDoc[]
  globalHost: string
  global: string
  alovaVersion: AlovaVersion
  commentText: string
  useImportType: boolean
  type: TemplateType
}
