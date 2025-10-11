import type { ApiMethod, OpenAPIDocument } from '@/type'
import { HttpMethod } from '@/type'

/**
 * 支持的API方法列表
 * @see https://github.com/alovajs/alova/blob/main/packages/alova/typings/index.d.ts#L640
 */
export const supportedApiMethods: HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.PUT,
  HttpMethod.POST,
  HttpMethod.DELETE,
  HttpMethod.PATCH,
  HttpMethod.HEAD,
  HttpMethod.OPTIONS,
]

export class OpenApiHelper {
  private document: OpenAPIDocument
  public load(document: OpenAPIDocument) {
    this.document = document
    return this
  }

  static load(document: OpenAPIDocument) {
    const ins = new OpenApiHelper()
    return ins.load(document)
  }

  public getApiMethods() {
    const paths = this.document.paths || []
    const apiMethods: ApiMethod[] = []
    for (const [url, pathInfo] of Object.entries(paths)) {
      if (!pathInfo) {
        continue
      }
      for (const [method, operationObject] of Object.entries(pathInfo)) {
        if (!supportedApiMethods.includes(method as HttpMethod)) {
          continue
        }
        if (typeof operationObject === 'string' || Array.isArray(operationObject)) {
          continue
        }
        apiMethods.push({
          url,
          method,
          operationObject,
        })
      }
    }
    return apiMethods
  }
}

export const openApiHelper = new OpenApiHelper()
