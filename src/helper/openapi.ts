import { cloneDeep, isArray, isEqualWith, isObject, mergeWith, sortBy } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
/**
 * 判断是否是$ref对象
 * @param obj 判断对象
 * @returns 是否是$ref对象
 */
export function isReferenceObject(obj: any): obj is OpenAPIV3.ReferenceObject {
  return !!(obj as OpenAPIV3.ReferenceObject)?.$ref;
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
  const nameArr = pathArr[pathArr.length - 1].split('');
  if (!toUpperCase) {
    return nameArr.join('');
  }
  return (nameArr?.[0]?.toUpperCase?.() ?? '') + nameArr.slice(1).join('');
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
  // console.log(schemaOrigin, 79);

  if (isReferenceObject(deepSchemaOrigin)) {
    if (searchMap.has(deepSchemaOrigin.$ref)) {
      return searchMap.get(deepSchemaOrigin.$ref) as T;
    }
    schema = findBy$ref<OpenAPIV3_1.SchemaObject>(deepSchemaOrigin.$ref, openApi, true);
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
      const keys = [...new Set([...Object.keys(sortObjValue), ...Object.keys(sortOtherValue)])];
      return keys.every(key => isEqualWith((sortObjValue as any)[key], (sortOtherValue as any)[key], customizer));
    }
    // 如果是对象，递归比较
    if (isObject(objValue) && isObject(otherValue)) {
      if (visited.has(objValue) && visited.get(objValue) === otherValue) {
        return true;
      }
      visited.set(objValue, otherValue);
      const keys = [...new Set([...Object.keys(objValue), ...Object.keys(otherValue)])];
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
    const name = get$refName(path, false);
    const [, nameVersion = 0] = /(\d+)$/.exec(name) ?? [];
    return Number(nameVersion);
  }
  function getOnlyName(path: string) {
    const name = get$refName(path, false);
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
/**
 * 合并openApi文档对象尽量以srcValue为准
 * @param objValue
 * @param srcValue
 * @param openApi
 * @returns
 */
export const mergeObject = <T>(objValue: any, srcValue: any, openApi: OpenAPIV3_1.Document): T => {
  const map: Array<[string, any]> = [];
  function customizer(objValue: any, srcValue: any): any {
    // 如果都是数组，并且srcValue为空数组，则直接返回srcValue
    if (isArray(objValue) && isArray(srcValue) && !srcValue.length) {
      return srcValue;
    }
    // 如果是对象，则递归合并
    if (isObject(objValue) && isObject(srcValue) && !isReferenceObject(objValue) && !isReferenceObject(srcValue)) {
      return mergeWith(objValue, srcValue, customizer);
    }
    // 处理$ref合并
    if (isReferenceObject(objValue)) {
      if (isReferenceObject(srcValue) && objValue.$ref === srcValue.$ref) {
        return objValue;
      }
      if (isEqualObject(objValue, srcValue, openApi)) {
        return objValue;
      }
      const [path] = map.find(([, item]) => isEqualObject(item, srcValue, openApi)) ?? [];
      if (path) {
        return cloneDeep({
          ...objValue,
          $ref: path
        });
      }
      const nextPath = getNext$refKey(objValue.$ref, map);
      const objValue2 = findBy$ref(objValue.$ref, openApi, true);
      const nextValue = mergeWith(objValue2, srcValue, customizer);
      map.push([nextPath, nextValue]);
      setComponentsBy$ref(nextPath, nextValue, openApi);
      return cloneDeep({
        ...objValue,
        $ref: nextPath
      });
    }
    return srcValue;
  }
  return mergeWith(objValue, srcValue, customizer);
};
