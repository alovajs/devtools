import { logger } from '@/helper/logger';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function fetchData(url: string) {
  return createAlova({ requestAdapter: adapterFetch() })
    .Get<Response>(url)
    .then(response => {
      if (!response.ok) {
        throw logger.throwError(`HTTP error! status: ${response.status}`, {
          url
        });
      }
      return response.text();
    });
}

// Remove all empty undefined values

export function removeUndefined<T>(obj: T) {
  const defaultObject = Array.isArray(obj) ? [] : {};
  if (typeof obj !== 'object' || !obj) {
    return obj;
  }
  return Object.keys(obj).reduce((result, key) => {
    const value = removeUndefined((obj as any)[key]);
    if (value !== undefined) {
      (result as any)[key] = value;
    }
    return result;
  }, defaultObject) as T;
}

export function isEmpty(value: any) {
  return value === null || value === undefined || value === '';
}
export function capitalizeFirstLetter(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const existsPromise = async (path: string, mode?: number) => {
  try {
    await fs.access(path, mode);
    return true;
  } catch {
    return false;
  }
};

export const resolveConfigFile = async (projectPath: string) => {
  const extensions = ['js', 'cjs', 'mjs', 'ts', 'mts', 'cts'];
  for (const ext of extensions) {
    const configFile = path.join(projectPath, `alova.config.${ext}`);
    if (await existsPromise(configFile)) {
      return configFile;
    }
  }
  return null;
};

export const strHashCode = (str: string) => {
  let hash = 0;
  let i;
  let chr;
  if (str.length === 0) {
    return hash;
  }
  for (i = 0; i < str.length; i += 1) {
    chr = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export function getType(value: unknown) {
  // 处理 null 和 undefined
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  // 基本类型
  const type = typeof value;
  if (type !== 'object' && type !== 'function') {
    if (type === 'number' && Number.isNaN(value)) return 'NaN';
    if (type === 'number' && !Number.isFinite(value)) {
      return (value as number) > 0 ? 'Infinity' : '-Infinity';
    }
    if (type === 'number' && Number.parseInt(`${value}`, 10) === value) {
      return 'integer';
    }
    return type;
  }

  // 特殊对象类型
  if (Array.isArray(value)) return 'Array';
  if (value instanceof Date) return 'Date';
  if (value instanceof RegExp) return 'RegExp';
  if (value instanceof Map) return 'Map';
  if (value instanceof Set) return 'Set';
  if (value instanceof Promise) return 'Promise';
  if (value instanceof Error) return 'Error';

  // 函数类型
  if (typeof value === 'function') {
    if (value.constructor.name === 'AsyncFunction') return 'AsyncFunction';
    if (value.constructor.name === 'GeneratorFunction') return 'GeneratorFunction';
    return 'Function';
  }

  // 其他对象类型
  const tag = Object.prototype.toString.call(value).slice(8, -1);
  if (tag !== 'Object') return tag;

  // 自定义类实例
  if (value.constructor && value.constructor !== Object) {
    return `Class (${value.constructor.name})`;
  }

  // 普通对象
  return 'Object';
}
