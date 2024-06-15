import path from 'node:path';
import { OpenAPIV3_1 } from 'openapi-types';
import openApi2Data from '../functions/openApi2Data';
import { TemplateFile } from '../modules/TemplateFile';
import getFrameworkTag from './getFrameworkTag';
export default async function (
  workspaceRootDir: string,
  outputPath: string,
  data: OpenAPIV3_1.Document,
  type: TemplateType
) {
  if (!data) {
    return;
  }
  const outputDir = path.join(workspaceRootDir, outputPath);
  const templateFile = new TemplateFile(type);
  // 将openApi对象转成template对象
  const templateData = await openApi2Data(data);
  // 框架技术栈标签  vue | react
  templateData[getFrameworkTag(workspaceRootDir)] = true;
  // 头部注释部分
  templateData.commentText = await templateFile.readAndRenderTemplate('comment', data, { root: true });
  // mustache语法生成
  // 定义模版配置对象
  [
    {
      fileName: 'index'
    },
    {
      fileName: 'createApis'
    },
    {
      fileName: 'apiDefinitions'
    },
    {
      fileName: 'globals.d',
      ext: '.ts'
    }
  ].forEach(({ fileName, ext }) => {
    templateFile.outputFile(templateData, fileName, outputDir, { ext });
  });
}
