import path from 'node:path';

const fs = require('fs');
const mustache = require('mustache');

/**
 * 读取并渲染 Mustache 文件
 * @param {string} templatePath - 模板文件路径
 * @param {object} view - 渲染模板所需的数据对象
 * @returns {Promise<string>} - 渲染后的内容
 */
export async function readAndRenderTemplate(templatePath: any, view: any) {
  return new Promise((resolve, reject) => {
    fs.readFile(templatePath, 'utf-8', (err: Error, data: any) => {
      if (err) {
        return reject(err);
      }
      const output = mustache.render(data, view);
      resolve(output);
    });
  });
}

/**
 * 传入文本内容，在指定目录下生成自定义文件
 * @param {string} distDir - 待生成文件所在目录
 * @param {string} fileName - 待生成文件名
 * @param {string} content - 文件内容
 */
export function generateFile(distDir: string, fileName: string, content: any) {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  const filePath = path.join(distDir, fileName);
  fs.writeFile(filePath, content, (err: Error) => {
    if (err) {
      return console.error('Error writing file:', err);
    }
    console.log('File written successfully at', filePath);
  });
}
