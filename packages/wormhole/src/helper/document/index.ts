import { ApiMethod, HttpMethod, OpenAPIDocument } from '@/type';

export const supportedApiMethods: HttpMethod[] = [HttpMethod.GET, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE];

export class OpenApiHelper {
  private document: OpenAPIDocument;
  public load(document: OpenAPIDocument) {
    this.document = document;
    return this;
  }
  static load(document: OpenAPIDocument) {
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
        if (!supportedApiMethods.includes(method as HttpMethod)) {
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
