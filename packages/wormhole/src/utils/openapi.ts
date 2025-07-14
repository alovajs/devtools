import type { MaybeArraySchemaObject, OpenAPIDocument, ReferenceObject, ResponsesObject, SchemaObject } from '@/type'
import { cloneDeep, isArray, isEqualWith, isObject, mergeWith, sortBy } from 'lodash'
import { getGlobalConfig } from '@/config'
import { standardLoader } from '@/core/loader'
import { capitalizeFirstLetter } from '@/utils'
/**
 * Determine whether it is a $ref object
 * @param obj Judgment object
 * @returns Whether it is a $ref object
 */
export function isReferenceObject(obj: any): obj is ReferenceObject {
  return !!(obj as ReferenceObject)?.$ref
}
function isBaseReferenceObject(obj: any): obj is { _$ref: string } & Record<string, any> {
  return !!(obj as { _$ref: string })?._$ref
}
export function isMaybeArraySchemaObject(obj: any): obj is MaybeArraySchemaObject {
  return !!(obj as MaybeArraySchemaObject)?.items
}

/**
 *
 * @param path $ref search path
 * @param openApi openApi document object
 * @param isDeep Whether to deep copy
 * @returns SchemaObject found
 */
export function findBy$ref<T = SchemaObject>(path: string, openApi: OpenAPIDocument, isDeep: boolean = false) {
  const pathArr = path.split('/')
  let find: any = {
    '#': openApi,
  }
  pathArr.forEach((key) => {
    if (find) {
      find = find[key]
    }
  })
  if (!find) {
    const DEFAULT_CONFIG = getGlobalConfig()
    throw new DEFAULT_CONFIG.Error(`cannot find $ref '${path}'`)
  }
  return (isDeep ? cloneDeep(find) : find) as T
}
export function parseReference<T, U = Exclude<T, ReferenceObject>>(obj: T, document: OpenAPIDocument, isDeep: boolean = false): U {
  if (isReferenceObject(obj)) {
    return findBy$ref<U>(obj.$ref, document, isDeep)
  }
  return obj as unknown as U
}
export function dereference<T, U = Exclude<T, ReferenceObject>>(obj: T, document: OpenAPIDocument, isDeep: boolean = false): U {
  if (isReferenceObject(obj)) {
    const result = findBy$ref<U & { description?: string }>(obj.$ref, document, isDeep)
    const description = obj.description || result.description
    return {
      ...result,
      description,
    }
  }
  return obj as unknown as U
}
export function nextReference(schema: SchemaObject) {
  for (const keyStr of Object.keys(schema)) {
    const key = keyStr as keyof SchemaObject
    if (schema[key] && typeof schema[key] === 'object' && isReferenceObject(schema[key])) {
      return schema[key]
    }
  }
  return null
}
/**
 *
 * @param path $ref path
 * @param data Reuse object
 * @param openApi Inserted openapi document object
 */
export function setComponentsBy$ref(path: string, data: any, openApi: OpenAPIDocument) {
  const pathArr = path.split('/')
  let find: any = {
    '#': openApi,
  }
  pathArr.forEach((key, idx) => {
    if (idx + 1 === pathArr.length) {
      find[key] = data
      return
    }
    if (find[key]) {
      find = find[key]
    }
    else {
      find = find[key] = {}
    }
  })
}
/**
 *
 * @param path $ref path
 * @param toUpperCase Whether the initial letter size
 * @returns Reference object name
 */
export function get$refName(path: string, toUpperCase: boolean = true) {
  const pathArr = path.split('/')
  const name = pathArr[pathArr.length - 1]
  if (!toUpperCase) {
    return name
  }
  return capitalizeFirstLetter(name)
}
/**
 *
 * @param schemaOrigin Object with $ref
 * @param openApi openApi document object
 * @returns Removed $ref object
 */
export function removeAll$ref<T = SchemaObject>(schemaOrigin: any, openApi: OpenAPIDocument, searchMap: Map<string, SchemaObject> = new Map()) {
  const deepSchemaOrigin = cloneDeep(schemaOrigin)
  let schema: SchemaObject & Record<string, any>
  if (isReferenceObject(deepSchemaOrigin)) {
    if (searchMap.has(deepSchemaOrigin.$ref)) {
      return searchMap.get(deepSchemaOrigin.$ref) as T
    }
    schema = findBy$ref<SchemaObject>(deepSchemaOrigin.$ref, openApi, true)
    // Mark for easy restoration

    schema._$ref = deepSchemaOrigin.$ref
    searchMap.set(deepSchemaOrigin.$ref, schema)
  }
  else {
    schema = deepSchemaOrigin
  }
  for (const key of Object.keys(schema)) {
    if (schema[key] && typeof schema[key] === 'object') {
      schema[key] = removeAll$ref(schema[key], openApi, searchMap)
    }
  }
  return schema as T
}
/**
 *
 * @param objValue object to be compared
 * @param srcValue source object
 * @param openApi openApi document object
 * @returns Are they equal?
 */
export function isEqualObject(objValue: any, srcValue: any, openApi: OpenAPIDocument) {
  const visited = new WeakMap()
  const ignoreKeyArr = ['_$ref']
  function customizer(objValueOrigin: any, otherValueOrigin: any) {
    if (objValueOrigin === otherValueOrigin) {
      return true
    }
    let objValue = objValueOrigin
    let otherValue = otherValueOrigin
    if (isReferenceObject(objValueOrigin)) {
      objValue = findBy$ref(objValueOrigin.$ref, openApi)
    }
    if (isReferenceObject(otherValueOrigin)) {
      otherValue = findBy$ref(otherValueOrigin.$ref, openApi)
    }
    // Ignore the effect of array order

    if (isArray(objValue) && isArray(otherValue)) {
      const sortObjValue = sortBy(objValue)
      const sortOtherValue = sortBy(otherValue)
      const keys = [...new Set([...Object.keys(sortObjValue), ...Object.keys(sortOtherValue)])].filter(
        key => !ignoreKeyArr.includes(key),
      )
      return keys.every(key => isEqualWith((sortObjValue as any)[key], (sortOtherValue as any)[key], customizer))
    }
    // If it is an object, compare recursively

    if (isObject(objValue) && isObject(otherValue)) {
      if (visited.has(objValue) && visited.get(objValue) === otherValue) {
        return true
      }
      visited.set(objValue, otherValue)
      const keys = [...new Set([...Object.keys(objValue), ...Object.keys(otherValue)])].filter(
        key => !ignoreKeyArr.includes(key),
      )
      return keys.every(key => isEqualWith((objValue as any)[key], (otherValue as any)[key], customizer))
    }
  }
  return isEqualWith(objValue, srcValue, customizer)
}
/**
 *
 * @param path $ref path
 * @param map Existing $ref path
 * @returns Another version of the $ref path
 */
export function getNext$refKey(path: string, map: Array<[string, any]> = []) {
  function getNameVersion(path: string) {
    const name = standardLoader.transformRefName(path, {
      toUpperCase: false,
    })
    const [, nameVersion = 0] = /(\d+)$/.exec(name) ?? []
    return Number(nameVersion)
  }
  function getOnlyName(path: string) {
    const name = standardLoader.transformRefName(path, {
      toUpperCase: false,
    })
    return name.replace(/\d+$/, '')
  }
  function getOnlyPath(path: string) {
    return path.split('/').slice(0, -1).join('/')
  }
  const name = getOnlyName(path)
  const basePath = getOnlyPath(path)
  let nameVersion = getNameVersion(path)
  map.forEach(([key]) => {
    if (getOnlyName(key) === name && getOnlyPath(path) === basePath) {
      nameVersion = Math.max(nameVersion, getNameVersion(key))
    }
  })
  return `${basePath}/${name}${nameVersion + 1}`
}
function isCircular(obj: any) {
  const seenObjects = new WeakSet()

  function detect(obj: any) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.has(obj)) {
        return true
      }
      seenObjects.add(obj)
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (detect(obj[key])) {
            return true
          }
        }
      }
    }
    return false
  }

  return detect(obj)
}
function hasBaseReferenceObject(obj: any) {
  if (obj && typeof obj === 'object') {
    if (isBaseReferenceObject(obj)) {
      return true
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (hasBaseReferenceObject(obj[key])) {
          return true
        }
      }
    }
  }
  return false
}
function removeBaseReference(obj: Record<string, any>, openApi: OpenAPIDocument, map: Array<[string, any]>) {
  if (isBaseReferenceObject(obj)) {
    const refObj = { $ref: obj._$ref }
    if (isEqualObject(obj, refObj, openApi)) {
      return refObj
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBaseReferenceObject(obj[key])) {
        obj[key] = removeBaseReference(obj[key], openApi, map)
      }
    }
    const [path] = map.find(([, item]) => isEqualObject(item, obj, openApi)) ?? []
    if (path) {
      return {
        $ref: path,
      }
    }
    const nextPath = getNext$refKey(refObj.$ref, map)
    map.push([nextPath, obj])
    setComponentsBy$ref(nextPath, obj, openApi)
    return {
      $ref: nextPath,
    }
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBaseReferenceObject(obj[key])) {
      obj[key] = removeBaseReference(obj[key], openApi, map)
    }
  }
  return obj
}
function unCircular(
  obj: Record<string, any>,
  openApi: OpenAPIDocument,
  map: Array<[string, any]>,
  objPath = '$',
  seen = new WeakMap<object, { $ref: string }>(),
) {
  if (typeof obj !== 'object' || obj === null) {
    return obj // 原始值直接返回
  }
  if (seen.has(obj)) {
    return seen.get(obj)
  }
  const setSeen = (obj: object, refOjec: { $ref: string }) => {
    const oldRefObj = seen.get(obj) ?? refOjec
    oldRefObj.$ref = refOjec.$ref
    seen.set(obj, oldRefObj)
  }
  const $ref = `#/components/schemas/${standardLoader.transform(standardLoader.transformRadomVariable(objPath), {
    style: 'camelCas',
  })}`
  setSeen(obj, { $ref })
  if (isBaseReferenceObject(obj)) {
    const refObj = { $ref: obj._$ref }
    if (isEqualObject(obj, refObj, openApi)) {
      setSeen(obj, refObj)
      return refObj
    }
    const nextPath = getNext$refKey(refObj.$ref, map)
    seen.set(obj, { $ref: nextPath })
    map.push([nextPath, obj])
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = unCircular(obj[key], openApi, map, `${objPath}.${key}`, seen)
      }
    }
    setComponentsBy$ref(nextPath, obj, openApi)
    return {
      $ref: nextPath,
    }
  }
  map.push([$ref, obj])
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = unCircular(obj[key], openApi, map, `${objPath}.${key}`, seen)
    }
  }
  setComponentsBy$ref($ref, obj, openApi)
  return obj
}
/**
 * When merging openApi document objects, try to use srcValue as the standard.
 * @template T
 * @param objValue
 * @param srcValue
 * @param openApi
 * @returns T
 */
export function mergeObject<T>(objValue: any, srcValue: any, openApi: OpenAPIDocument, map: Array<[string, any]> = []): T {
  function customizer(objValue: any, srcValue: any): any {
    // If they are all arrays and the src value is an empty array, the src value will be returned directly.

    if (isArray(objValue) && isArray(srcValue) && !srcValue.length) {
      return srcValue
    }
    if (isEqualObject(objValue, srcValue, openApi)) {
      return objValue
    }
    // Handle circular references

    if (isCircular(srcValue)) {
      srcValue = unCircular(srcValue, openApi, map, standardLoader.transformRadomVariable(JSON.stringify(objValue)))
    }
    // Is there also a $ref attribute?

    if (hasBaseReferenceObject(srcValue)) {
      return removeBaseReference(srcValue, openApi, map)
    }
    return srcValue
  }
  return mergeWith(cloneDeep(objValue), srcValue, customizer)
}

export function getResponseSuccessKey(responsesObject?: ResponsesObject) {
  if (!responsesObject) {
    return '200'
  }
  const successKeys = Object.keys(responsesObject)
    .map(key => Number(key))
    .filter(key => !Number.isNaN(key) && key >= 200 && key < 300)
    .sort((a, b) => a - b)
  return `${successKeys[0] ?? 'default'}`
}
