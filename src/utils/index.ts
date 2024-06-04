import mustache from 'mustache';
import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 读取并渲染 Mustache 文件
 * @param templatePath 模板文件路径
 * @param view - 渲染模板所需的数据对象
 * @returns 渲染后的内容
 */
export async function readAndRenderTemplate(templatePath: string, view: any): Promise<string> {
  try {
    const data = await fs.readFileSync(templatePath, 'utf-8');
    const output = mustache.render(data, view);
    return output;
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
export function generateFile(distDir: string, fileName: string, content: string) {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  const filePath = path.join(distDir, fileName);
  fs.writeFile(filePath, content, (err: NodeJS.ErrnoException | null) => {
    if (err) {
      return console.error('Error writing file:', err);
    }
    console.log('File written successfully at', filePath);
  });
}

export async function fetchData(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
