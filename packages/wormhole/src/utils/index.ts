import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import handlebars, { HelperOptions } from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Config as PrettierConfig } from 'prettier';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEsTree from 'prettier/plugins/estree';
import * as prettierTs from 'prettier/plugins/typescript';
import * as prettier from 'prettier/standalone';
import { DEFAULT_CONFIG } from '../config';

export const prettierConfig: PrettierConfig = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  insertPragma: false,
  endOfLine: 'auto',
  bracketSameLine: true,
  arrowParens: 'avoid',
  vueIndentScriptAndStyle: false,
  singleAttributePerLine: true
};
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
handlebars.registerHelper('not', (a, b) => a !== b);
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
export async function readAndRenderTemplate(templatePath: string, view: any) {
  let data = '';
  try {
    data = await fs.readFile(path.resolve(DEFAULT_CONFIG.templatePath, `${templatePath}.handlebars`), 'utf-8');
  } catch (error) {
    data = (await import(`./templates/${templatePath}.handlebars`)).default;
  }
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
  if (!(await existsPromise(distDir))) {
    await fs.mkdir(distDir, { recursive: true });
  }
  const filePath = path.join(distDir, fileName);
  const formattedText = await format(content);
  await fs.writeFile(filePath, formattedText);
}
export async function fetchData(url: string) {
  return createAlova({ requestAdapter: adapterFetch() })
    .Get<Response>(url)
    .then(response => {
      if (!response.ok) {
        throw new DEFAULT_CONFIG.Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    });
}

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
