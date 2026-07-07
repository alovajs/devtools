import type { ApiMethod, OpenAPIDocument, ReferenceObject } from '@/type'
import { HttpMethod } from '@/type'
import { findBy$ref, isReferenceObject } from '@/utils'

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
   * 将 ApiMethods 数组写回到 openapi document 的 paths 中。
   * 仅更新传入的 url+method 对应的 operationObject，保留其它未涉及的内容。
   */
  public saveApiMethods(apiMethods: ApiMethod[]) {
    this.document.paths = {} as any
    // 构建 url -> { method -> operationObject } 映射，后写入覆盖前者
    const grouped: Record<string, Record<string, any>> = {}
    for (const item of apiMethods || []) {
      if (!item || !item.url || !item.method || !item.operationObject) {
        continue
      }
      const method = String(item.method).toLowerCase() as HttpMethod
      if (!supportedApiMethods.includes(method)) {
        // 跳过不支持的 http 方法
        continue
      }
      if (!grouped[item.url]) {
        grouped[item.url] = {}
      }
      grouped[item.url][method] = item.operationObject
    }

    // 将分组后的方法写回到 document.paths
    for (const [url, methodsMap] of Object.entries(grouped)) {
      const pathInfo = (this.document.paths?.[url] || {}) as Record<string, any>
      for (const [method, operationObject] of Object.entries(methodsMap)) {
        pathInfo[method] = operationObject
      }
      if (this.document.paths) {
        this.document.paths[url] = pathInfo
      }
    }
    // 更新后清除引用缓存，确保后续计算的使用引用为最新
    this.usedRefsCache.clear()
    return this
  }

  /**
   * 判断某个引用是否在文档中被使用
   * @param ref ReferenceObject 或其 `$ref` 路径字符串
   */
  public isReferenceUsed(ref: string | ReferenceObject): boolean {
    const refPath = typeof ref === 'string' ? ref : ref.$ref
    const usedSet = this.getUsedReferenceSet()
    return usedSet.has(refPath)
  }

  /**
   * 预计算并返回已使用的 `$ref` 集合，仅从 paths 可达
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
   * 过滤掉未使用的引用，返回仍被使用的引用列表
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
