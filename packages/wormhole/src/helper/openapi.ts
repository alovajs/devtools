import { capitalizeFirstLetter } from '@/utils';
import { cloneDeep, isArray, isEqualWith, isObject, mergeWith, sortBy } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { isValidJSIdentifier, makeIdentifier } from './standard';
/**
 * 判断是否是$ref对象
 * @param obj 判断对象
 * @returns 是否是$ref对象
 */
export function isReferenceObject(obj: any): obj is OpenAPIV3.ReferenceObject {
  return !!(obj as OpenAPIV3.ReferenceObject)?.$ref;
}
function isBaseReferenceObject(obj: any): obj is { _$ref: string } & Record<string, any> {
  return !!(obj as { _$ref: string })?._$ref;
}

/**
 *
 * @param path $ref查找路径
 * @param openApi openApi文档对象
 * @param isDeep 是否深拷贝
 * @returns 查找到的SchemaObject
 */
export const findBy$ref = <T = OpenAPIV3_1.SchemaObject>(
  path: string,
  openApi: OpenAPIV3_1.Document,
  isDeep: boolean = false
) => {
  const pathArr = path.split('/');
  let find: any = {
    '#': openApi
  };
  pathArr.forEach(key => {
    if (find) {
      find = find[key];
    }
  });
  return (isDeep ? cloneDeep(find) : find) as T;
};
/**
 *
 * @param path $ref路径
 * @param data 复用对象
 * @param openApi 插入的openapi文档对象
 */
export const setComponentsBy$ref = (path: string, data: any, openApi: OpenAPIV3_1.Document) => {
  const pathArr = path.split('/');
  let find: any = {
    '#': openApi
  };
  pathArr.forEach((key, idx) => {
    if (idx + 1 === pathArr.length) {
      find[key] = data;
      return;
    }
    if (find[key]) {
      find = find[key];
    } else {
      find = find[key] = {};
    }
  });
};
/**
 *
 * @param path $ref路径
 * @param toUpperCase 是否首字母大小
 * @returns 引用对象名称
 */
export const get$refName = (path: string, toUpperCase: boolean = true) => {
  const pathArr = path.split('/');
  const name = pathArr[pathArr.length - 1];
  if (!toUpperCase) {
    return name;
  }
  return capitalizeFirstLetter(name);
};
/**
 *
 * @param schemaOrigin 含$ref的对象
 * @param openApi openApi文档对象
 * @returns 去除了$ref的对象
 */
export const removeAll$ref = <T = OpenAPIV3_1.SchemaObject>(
  schemaOrigin: any,
  openApi: OpenAPIV3_1.Document,
  searchMap: Map<string, OpenAPIV3_1.SchemaObject> = new Map()
) => {
  const deepSchemaOrigin = cloneDeep(schemaOrigin);
  let schema: OpenAPIV3_1.SchemaObject & Record<string, any>;
  if (isReferenceObject(deepSchemaOrigin)) {
    if (searchMap.has(deepSchemaOrigin.$ref)) {
      return searchMap.get(deepSchemaOrigin.$ref) as T;
    }
    schema = findBy$ref<OpenAPIV3_1.SchemaObject>(deepSchemaOrigin.$ref, openApi, true);
    // 做标记方便还原
    schema._$ref = deepSchemaOrigin.$ref;
    searchMap.set(deepSchemaOrigin.$ref, schema);
  } else {
    schema = deepSchemaOrigin;
  }
  for (const key of Object.keys(schema)) {
    if (schema[key] && typeof schema[key] === 'object') {
      schema[key] = removeAll$ref(schema[key], openApi, searchMap);
    }
  }
  return schema as T;
};
/**
 *
 * @param objValue 待比较的对象
 * @param srcValue 源对象
 * @param openApi openApi文档对象
 * @returns 是否相等
 */
export function isEqualObject(objValue: any, srcValue: any, openApi: OpenAPIV3_1.Document) {
  const visited = new WeakMap();
  const ignoreKeyArr = ['_$ref'];
  function customizer(objValueOrigin: any, otherValueOrigin: any) {
    if (objValueOrigin === otherValueOrigin) {
      return true;
    }
    let objValue = objValueOrigin;
    let otherValue = otherValueOrigin;
    if (isReferenceObject(objValueOrigin)) {
      objValue = findBy$ref(objValueOrigin.$ref, openApi);
    }
    if (isReferenceObject(otherValueOrigin)) {
      otherValue = findBy$ref(otherValueOrigin.$ref, openApi);
    }
    // 忽略数组顺序的影响
    if (isArray(objValue) && isArray(otherValue)) {
      const sortObjValue = sortBy(objValue);
      const sortOtherValue = sortBy(otherValue);
      const keys = [...new Set([...Object.keys(sortObjValue), ...Object.keys(sortOtherValue)])].filter(
        key => !ignoreKeyArr.includes(key)
      );
      return keys.every(key => isEqualWith((sortObjValue as any)[key], (sortOtherValue as any)[key], customizer));
    }
    // 如果是对象，递归比较
    if (isObject(objValue) && isObject(otherValue)) {
      if (visited.has(objValue) && visited.get(objValue) === otherValue) {
        return true;
      }
      visited.set(objValue, otherValue);
      const keys = [...new Set([...Object.keys(objValue), ...Object.keys(otherValue)])].filter(
        key => !ignoreKeyArr.includes(key)
      );
      return keys.every(key => isEqualWith((objValue as any)[key], (otherValue as any)[key], customizer));
    }
  }
  return isEqualWith(objValue, srcValue, customizer);
}
/**
 *
 * @param path $ref路径
 * @param map 已存在的$ref路径
 * @returns 另一个版本的$ref路径
 */
export function getNext$refKey(path: string, map: Array<[string, any]> = []) {
  function getNameVersion(path: string) {
    const name = getStandardRefName(path, false);
    const [, nameVersion = 0] = /(\d+)$/.exec(name) ?? [];
    return Number(nameVersion);
  }
  function getOnlyName(path: string) {
    const name = getStandardRefName(path, false);
    const [, onlyName] = /(.*?)(\d*)$/.exec(name) ?? [];
    return onlyName;
  }
  function getOnlyPath(path: string) {
    return path.split('/').slice(0, -1).join('/');
  }
  const name = getOnlyName(path);
  const basePath = getOnlyPath(path);
  let nameVersion = getNameVersion(path);
  map.forEach(([key]) => {
    if (getOnlyName(key) === name && getOnlyPath(path) === basePath) {
      nameVersion = Math.max(nameVersion, getNameVersion(key));
    }
  });
  return `${basePath}/${name}${nameVersion + 1}`;
}
function isCircular(obj: any) {
  const seenObjects = new WeakSet();

  function detect(obj: any) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.has(obj)) {
        return true;
      }
      seenObjects.add(obj);
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (detect(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  return detect(obj);
}
function hasBaseReferenceObject(obj: any) {
  if (obj && typeof obj === 'object') {
    if (isBaseReferenceObject(obj)) {
      return true;
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (hasBaseReferenceObject(obj[key])) {
          return true;
        }
      }
    }
  }
  return false;
}
function removeBaseReference(obj: Record<string, any>, openApi: OpenAPIV3_1.Document, map: Array<[string, any]>) {
  if (isBaseReferenceObject(obj)) {
    const refObj = { $ref: obj._$ref };
    if (isEqualObject(obj, refObj, openApi)) {
      return refObj;
    }
    for (const key in obj) {
      if (hasBaseReferenceObject(obj[key])) {
        obj[key] = removeBaseReference(obj[key], openApi, map);
      }
    }
    const [path] = map.find(([, item]) => isEqualObject(item, obj, openApi)) ?? [];
    if (path) {
      return {
        $ref: path
      };
    }
    const nextPath = getNext$refKey(refObj.$ref, map);
    map.push([nextPath, obj]);
    setComponentsBy$ref(nextPath, obj, openApi);
    return {
      $ref: nextPath
    };
  }
  for (const key in obj) {
    if (hasBaseReferenceObject(obj[key])) {
      obj[key] = removeBaseReference(obj[key], openApi, map);
    }
  }
  return obj;
}
function unCircular(obj: Record<string, any>, openApi: OpenAPIV3_1.Document, map: Array<[string, any]>) {
  if (isBaseReferenceObject(obj)) {
    const refObj = { $ref: obj._$ref };
    if (isEqualObject(obj, refObj, openApi)) {
      return refObj;
    }
    for (const key in obj) {
      if (isCircular(obj[key])) {
        obj[key] = unCircular(obj[key], openApi, map);
      }
    }
    const [path] = map.find(([, item]) => isEqualObject(item, obj, openApi)) ?? [];
    if (path) {
      return {
        $ref: path
      };
    }
    const nextPath = getNext$refKey(refObj.$ref, map);
    map.push([nextPath, obj]);
    setComponentsBy$ref(nextPath, obj, openApi);
    return {
      $ref: nextPath
    };
  }
  for (const key in obj) {
    if (isCircular(obj[key])) {
      obj[key] = unCircular(obj[key], openApi, map);
    }
  }
  return obj;
}
/**
 * 合并openApi文档对象尽量以srcValue为准
 * @param objValue
 * @param srcValue
 * @param openApi
 * @returns
 */
export const mergeObject = <T>(
  objValue: any,
  srcValue: any,
  openApi: OpenAPIV3_1.Document,
  map: Array<[string, any]> = []
): T => {
  function customizer(objValue: any, srcValue: any): any {
    // 如果都是数组，并且srcValue为空数组，则直接返回srcValue
    if (isArray(objValue) && isArray(srcValue) && !srcValue.length) {
      return srcValue;
    }
    if (isEqualObject(objValue, srcValue, openApi)) {
      return objValue;
    }
    // 处理循环引用
    if (isCircular(srcValue)) {
      srcValue = unCircular(srcValue, openApi, map);
    }
    // 是否还有_$ref属性
    if (hasBaseReferenceObject(srcValue)) {
      return removeBaseReference(srcValue, openApi, map);
    }
    return srcValue;
  }
  return mergeWith(cloneDeep(objValue), srcValue, customizer);
};
const refPathMap = new Map<string, string>();
const refNameSet = new Set<string>();
export function getStandardRefName(refPath: string, toUpperCase: boolean = true) {
  if (refPathMap.has(refPath)) {
    return refPathMap.get(refPath) ?? '';
  }
  const refName = get$refName(refPath, toUpperCase);
  if (isValidJSIdentifier(refName)) {
    refNameSet.add(refName);
    refPathMap.set(refPath, refName);
    return refName;
  }
  let newRefName = makeIdentifier(refName, 'snakeCase');
  if (toUpperCase) {
    newRefName = capitalizeFirstLetter(newRefName);
  }
  if (refNameSet.has(newRefName)) {
    let num = 1;
    while (refNameSet.has(`${newRefName}${num}`)) {
      num += 1;
    }
    newRefName = `${newRefName}${num}`;
  }
  refNameSet.add(newRefName);
  refPathMap.set(refPath, newRefName);
  return newRefName;
}
