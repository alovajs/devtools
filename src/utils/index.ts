import handlebars, { HelperOptions } from 'handlebars';
import fetch from 'node-fetch';
import fs, { promises } from 'node:fs';
import path from 'node:path';
import prettier, { Config as prettierConfig } from 'prettier';
import { projectPath } from './path';
export const getType = (obj: any) => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
handlebars.registerHelper('isType', function (this: any, value, type: string, options: HelperOptions) {
  if (getType(value) === type) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});
handlebars.registerHelper('and', function (this: any) {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  const options = arguments[arguments.length - 1];
  const result = args.every(arg => {
    if (Array.isArray(arg)) {
      return arg.length === 0;
    }
    return Boolean(arg);
  });
  return result ? options.fn(this) : options.inverse(this);
});
handlebars.registerHelper('or', function (this: any) {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  const options = arguments[arguments.length - 1];

  const result = args.some(arg => {
    if (Array.isArray(arg)) {
      return arg.length !== 0;
    }
    return Boolean(arg);
  });
  return result ? options.fn(this) : options.inverse(this);
});
handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});
// 注册自定义助手函数 'raw'
handlebars.registerHelper('raw', function (text) {
  // 返回原始字符串，不进行 HTML 转义
  return new handlebars.SafeString(text);
});
/**
 * 读取并渲染 handlebars 文件
 * @param templatePath 模板文件路径
 * @param view - 渲染模板所需的数据对象
 * @returns 渲染后的内容
 */
export async function readAndRenderTemplate(templatePath: string, view: any): Promise<string> {
  try {
    const data = await promises.readFile(templatePath, 'utf-8');
    return handlebars.compile(data)(view);
  } catch (err) {
    throw err;
  }
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
export function format(text: string, config?: prettierConfig) {
  const prettierConfig = require(path.join(projectPath, './.prettierrc.cjs'));
  return prettier.format(text, {
    ...prettierConfig,
    parser: 'typescript', // 指定使用 babel 解析器
    ...(config ?? {})
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

  const run = () => {
    if (!isRunning) return;

    const start = Date.now();
    callback();
    const duration = Date.now() - start;
    const nextInterval = intervalInMilliseconds - duration;

    if (nextInterval > 0) {
      setTimeout(run, nextInterval);
    } else {
      setImmediate(run);
    }
  };

  if (immediate) {
    setImmediate(run);
  } else {
    setTimeout(run, intervalInMilliseconds);
  }

  return {
    isRunning() {
      return isRunning;
    },
    clear() {
      isRunning = false;
    },
    time: intervalInMilliseconds,
    immediate
  };
}
export const getFileNameByPath = (path: string) => {
  const [, name] = /[\/\\]([^\/\\]+)([\/\\])?$/.exec(path) ?? [];
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
