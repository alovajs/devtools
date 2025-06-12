import { OpenAPIV3_1 } from 'openapi-types';

const supportedApiMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
export interface ApiMethod {
  url: string;
  method: string;
  operationObject: OpenAPIV3_1.OperationObject;
}
export class OpenApiHelper {
  private document: OpenAPIV3_1.Document;
  public load(document: OpenAPIV3_1.Document) {
    this.document = document;
    return this;
  }
  static load(document: OpenAPIV3_1.Document) {
    const ins = new OpenApiHelper();
    return ins.load(document);
  }
  public getApiMethods() {
    const paths = this.document.paths || [];
    const apiMethods: ApiMethod[] = [];
    for (const [url, pathInfo] of Object.entries(paths)) {
      if (!pathInfo) {
        continue;
      }
      for (const [method, operationObject] of Object.entries(pathInfo)) {
        if (!supportedApiMethods.includes(method)) {
          continue;
        }
        if (typeof operationObject === 'string' || Array.isArray(operationObject)) {
          continue;
        }
        apiMethods.push({
          url,
          method,
          operationObject
        });
      }
    }
    return apiMethods;
  }
}

export const openApiHelper = new OpenApiHelper();
