import openApi2Data from '@/functions/openApi2Data';
import { getAlovaJsonPath, TEMPLATE_DATA, TemplateFile, writeAlovaJson } from '@/modules/TemplateFile';
import { isEqual } from 'lodash';
import fs from 'node:fs';
import path from 'node:path';
import { OpenAPIV3_1 } from 'openapi-types';
import getFrameworkTag from './getFrameworkTag';

export default async function (
  workspaceRootDir: string,
  outputPath: string,
  data: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  type: TemplateType,
  force = false
) {
  if (!data) {
    return;
  }
  // 输出目录
  const outputDir = path.join(workspaceRootDir, outputPath);
  // 缓存文件地址
  const alovaJsonPath = getAlovaJsonPath(workspaceRootDir, outputPath);
  const templateFile = new TemplateFile(type);
  // 将openApi对象转成template对象
  const templateData = await openApi2Data(data, config);
  // 框架技术栈标签  vue | react
  templateData[getFrameworkTag(workspaceRootDir)] = true;
  // 头部注释部分
  templateData.commentText = await templateFile.readAndRenderTemplate('comment', data, { root: true });
  // 模块类型
  templateData.moduleType = TemplateFile.getModuleType(type);
  // 是否需要生成api文件
  // 判断是否需要生成api文件
  if (!force && isEqual(templateData, TEMPLATE_DATA.get(alovaJsonPath))) {
    return false;
  }
  // 保存templateData
  TEMPLATE_DATA.set(alovaJsonPath, templateData);
  // 生成alova.json文件
  writeAlovaJson(templateData, alovaJsonPath);
  // 获取是否存在index.ts|index.js
  const indexIsExists = fs.existsSync(path.join(outputDir, `index${templateFile.getExt()}`));
  // mustache语法生成
  // 定义模版配置对象
  [
    !indexIsExists && {
      fileName: 'index'
    },
    {
      fileName: 'createApis'
    },
    {
      fileName: 'apiDefinitions',
      root: true
    },
    {
      fileName: 'globals.d',
      ext: '.ts',
      root: true
    }
  ].forEach(item => {
    if (!item) {
      return;
    }
    const { fileName, ext, root } = item;
    templateFile.outputFile(templateData, fileName, outputDir, { ext, root });
  });
  return true;
}
