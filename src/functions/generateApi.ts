import path from 'node:path';
import { OpenAPIV3 } from 'openapi-types';
import { TemplateFile } from '../modules/TemplateFile';
import getFrameworkTag from './getFrameworkTag';
export default async function (
  workspaceRootDir: string,
  outputPath: string,
  data: OpenAPIV3.Document,
  type: TemplateType
) {
  if (!data) {
    return;
  }

  // 框架技术栈标签  vue | react
  const frameTag = getFrameworkTag(workspaceRootDir);
  const outputDir = path.join(workspaceRootDir, outputPath);
  if (!data.paths) {
    return;
  }
  const paths = data.paths;
  interface PathInfo {
    key: string;
    method: string;
    path: string;
  }
  const pathInfoArr: PathInfo[] = [];
  for (const [path, pathInfo] of Object.entries(paths)) {
    for (const [method, methodInfo] of Object.entries(pathInfo as Object)) {
      if (['parameters'].includes(method)) {
        continue;
      }
      const methodFormat = method.toUpperCase();
      pathInfoArr.push({
        key: `${methodInfo.tags[0]}.${methodInfo.operationId}`,
        method: methodFormat,
        path
      });
    }
  }
  // 准备interface需要的数据
  // 将接口数据对象转为数组结构
  if (!data.components || !data.components.schemas) return;
  const schemas = data.components.schemas;
  (data as any).baseUrl = data.servers?.[0].url || '';
  interface propertiesInfoItem {
    key: string;
    type: string;
    example: string;
    enum: string | undefined;
    deprecated: boolean;
    description: string;
  }
  interface schemasInfoItem {
    title: string;
    description: string;
    name: string;
    propertiesInfo: propertiesInfoItem[];
  }
  const schemasInfoArr: schemasInfoItem[] = [];
  for (const [schema, schemaInfo] of Object.entries(schemas)) {
    const propertiesInfo = [];
    if (!(schemaInfo as any).properties) {
      continue;
    }
    for (const [key, value] of Object.entries((schemaInfo as any).properties)) {
      console.log('🚀 ~ vscode.commands.registerCommand ~ value:', key, value);
      propertiesInfo.push({
        key,
        type: (value as any).type,
        example: (value as any).example,
        enum: (value as any).enum ? (value as any).enum.join('" | "') : undefined,
        deprecated: (value as any).deprecated,
        description: (value as any).description
      });
    }
    schemasInfoArr.push({
      title: (schemaInfo as any).title,
      description: (schemaInfo as any).description,
      name: schema,
      propertiesInfo
    });
  }
  const templateFile = new TemplateFile(type);
  // 头部注释部分
  const commentText = await templateFile.readAndRenderTemplate('comment', data, { root: true });

  // mustache语法生成
  // 定义模版配置对象
  [
    {
      fileName: 'index',
      injections: () => ({ ...data, [frameTag]: true })
    },
    {
      fileName: 'createApis',
      injections: () => data
    },
    {
      fileName: 'apiDefinitions',
      injections: () => ({ ...data, paths: pathInfoArr, commentText })
    },
    {
      fileName: 'globals.d',
      injections: () => ({
        ...data,
        schemasInfo: schemasInfoArr,
        commentText
      }),
      ext: '.ts'
    }
  ].forEach(({ fileName, injections, ext }) => {
    templateFile.outputFile(injections(), fileName, outputDir, { ext });
  });
}
