/* eslint-disable no-bitwise */
import prettierConfig from '#/prettier.config.cjs';
import Error from '@/components/error';
import handlebars, { HelperOptions } from 'handlebars';
import fetch from 'node-fetch';
import fs, { promises } from 'node:fs';
import path from 'node:path';
import { Config as PrettierConfig } from 'prettier';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEsTree from 'prettier/plugins/estree';
import * as prettierTs from 'prettier/plugins/typescript';
import * as prettier from 'prettier/standalone';

export const getType = (obj: any) => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
handlebars.registerHelper('isType', function (this: any, value, type: string, options: HelperOptions) {
  if (getType(value) === type) {
    return options.fn(this);
  }
  return options.inverse(this);
});
handlebars.registerHelper('and', function (this: any, ...rest) {
  const args = Array.prototype.slice.call(rest, 0, -1);
  const options = rest[rest.length - 1] as HelperOptions;
  const result = args.every(arg => {
    if (Array.isArray(arg)) {
      return arg.length === 0;
    }
    return Boolean(arg);
  });
  return result ? options.fn(this) : options.inverse(this);
});
handlebars.registerHelper('or', function (this: any, ...rest) {
  const args = Array.prototype.slice.call(rest, 0, -1);
  const options = rest[rest.length - 1] as HelperOptions;
  const result = args.some(arg => {
    if (Array.isArray(arg)) {
      return arg.length !== 0;
    }
    return Boolean(arg);
  });
  return result ? options.fn(this) : options.inverse(this);
});
handlebars.registerHelper('eq', (a, b) => a === b);
// 注册自定义助手函数 'raw'
handlebars.registerHelper(
  'raw',
  text =>
    // 返回原始字符串，不进行 HTML 转义
    new handlebars.SafeString(text)
);
/**
 * 读取并渲染 handlebars 文件
 * @param templatePath 模板文件路径
 * @param view - 渲染模板所需的数据对象
 * @returns 渲染后的内容
 */
export async function readAndRenderTemplate(templatePath: string, view: any): Promise<string> {
  const data = await promises.readFile(templatePath, 'utf-8');
  return handlebars.compile(data)(view);
}
export async function format(text: string, config?: PrettierConfig) {
  return prettier.format(text, {
    ...(prettierConfig as PrettierConfig),
    parser: 'typescript', // 指定使用 babel 解析器
    ...(config ?? {}),
    plugins: [prettierTs, prettierEsTree, prettierBabel]
  });
}
/**
 * 传入文本内容，在指定目录下生成自定义文件
 * @param distDir 待生成文件所在目录
 * @param fileName 待生成文件名
 * @param content 文件内容
 */
export async function generateFile(distDir: string, fileName: string, content: string) {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const filePath = path.join(distDir, fileName);
  const formattedText = await format(content);
  fs.writeFile(filePath, formattedText, (err: NodeJS.ErrnoException | null) => {
    if (err) {
      return console.error('Error writing file:', err);
    }
    console.log('File written successfully at', filePath);
  });
}
export async function fetchData(url: string) {
  return fetch(url).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  });
}

export function highPrecisionInterval(callback: () => void, intervalInMilliseconds: number, immediate = false) {
  let isRunning = true;
  if (immediate) {
    callback();
  }
  const timer = setInterval(callback, intervalInMilliseconds);

  return {
    isRunning() {
      return isRunning;
    },
    clear() {
      isRunning = false;
      clearInterval(timer);
    },
    time: intervalInMilliseconds,
    immediate
  };
}
export const getFileNameByPath = (path: string) => {
  const [, name] = /[/\\]([^/\\]+)([/\\])?$/.exec(path) ?? [];
  return name ?? '';
};
// 去掉所有为空的undefined值
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

// 生成唯一id
export function uuid() {
  let dt = new Date().getTime();
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return id;
}
// 反序列化
export function deserialize(serializedJavascript: string) {
  // eslint-disable-next-line no-eval
  return eval(`(${serializedJavascript})`);
}
export function isEmpty(value: any) {
  return value === null || value === undefined || value === '';
}
