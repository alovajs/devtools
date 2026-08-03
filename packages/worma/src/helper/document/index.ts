import type { ApiMethod, OpenAPIDocument, ReferenceObject } from '@/type'
import { HttpMethod } from '@/type'
import { findBy$ref, isReferenceObject } from '@/utils'

/**
 * List of supported API methods
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
  private usedRefsCache: Set<string> = new Set()
  public load(document: OpenAPIDocument) {
    this.document = document
    // reset cache when document changes
    this.usedRefsCache.clear()
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

  /**
   * Write the ApiMethods array back into the openapi document's paths.
   * Only updates the operationObject for the passed url+method, keeping the rest untouched.
   */
  public saveApiMethods(apiMethods: ApiMethod[]) {
    this.document.paths = {} as any
    // build a url -> { method -> operationObject } map; later writes overwrite earlier ones
    const grouped: Record<string, Record<string, any>> = {}
    for (const item of apiMethods || []) {
      if (!item || !item.url || !item.method || !item.operationObject) {
        continue
      }
      const method = String(item.method).toLowerCase() as HttpMethod
      if (!supportedApiMethods.includes(method)) {
        // skip unsupported http methods
        continue
      }
      if (!grouped[item.url]) {
        grouped[item.url] = {}
      }
      grouped[item.url][method] = item.operationObject
    }

    // write the grouped methods back into document.paths
    for (const [url, methodsMap] of Object.entries(grouped)) {
      const pathInfo = (this.document.paths?.[url] || {}) as Record<string, any>
      for (const [method, operationObject] of Object.entries(methodsMap)) {
        pathInfo[method] = operationObject
      }
      if (this.document.paths) {
        this.document.paths[url] = pathInfo
      }
    }
    // clear the reference cache after updating, ensuring subsequent used-reference computations are up to date
    this.usedRefsCache.clear()
    return this
  }

  /**
   * Check whether a reference is used in the document
   * @param ref ReferenceObject or its `$ref` path string
   */
  public isReferenceUsed(ref: string | ReferenceObject): boolean {
    const refPath = typeof ref === 'string' ? ref : ref.$ref
    const usedSet = this.getUsedReferenceSet()
    return usedSet.has(refPath)
  }

  /**
   * Precompute and return the set of used `$ref`s, reachable only from paths
   */
  public getUsedReferenceSet(): Set<string> {
    if (this.usedRefsCache.size > 0) {
      return this.usedRefsCache
    }
    const used = this.usedRefsCache
    const visitedRefs = new Set<string>()
    const stack: any[] = []

    const roots: any[] = []
    if (this.document.paths) {
      roots.push(this.document.paths)
    }
    stack.push(...roots)
    while (stack.length) {
      const node = stack.pop()
      if (!node || typeof node !== 'object') {
        continue
      }
      if (isReferenceObject(node)) {
        const currentRef = node.$ref
        used.add(currentRef)
        if (!visitedRefs.has(currentRef)) {
          visitedRefs.add(currentRef)
          try {
            const target = findBy$ref(currentRef, this.document)
            stack.push(target)
          }
          catch {
            // ignore invalid refs
          }
        }
        continue
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          stack.push(item)
        }
        continue
      }
      for (const key of Object.keys(node)) {
        stack.push(node[key])
      }
    }
    return used
  }

  /**
   * Filter out unused references and return the list of still-used references
   */
  public filterUsedReferences<T extends string | ReferenceObject>(refs: Array<T>): Array<T> {
    const usedSet = this.getUsedReferenceSet()
    return (refs || []).filter((ref) => {
      const refPath = typeof ref === 'string' ? ref : ref.$ref
      return usedSet.has(refPath)
    })
  }
}

export const openApiHelper = new OpenApiHelper()
