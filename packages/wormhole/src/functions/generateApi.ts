import { getGlobalConfig } from '@/config';
import type { GeneratorConfig, TemplateType } from '@/interface.type';
import { existsPromise } from '@/utils';
import { isEqual } from 'lodash';
import path from 'node:path';
import { OpenAPIV3_1 } from 'openapi-types';
import TemplateFile from '../modules/TemplateFile';
import { getAlovaJsonPath, writeAlovaJson } from './alovaJson';
import getAlovaVersion, { AlovaVersion } from './getAlovaVersion';
import getFrameworkTag from './getFrameworkTag';
import openApi2Data from './openApi2Data';

const DEFAULT_CONFIG = getGlobalConfig();
export default async function (
  workspaceRootDir: string, // 项目地址
  outputPath: string, // 输出路径
  data: OpenAPIV3_1.Document, // openapi数据
  config: GeneratorConfig, // generator配置
  type: TemplateType, // 模板类型
  force: boolean // 是否强制生成
) {
  if (!data) {
    return false;
  }
  // 输出目录
  const outputDir = path.resolve(workspaceRootDir, outputPath);
  // 缓存文件地址
  const alovaJsonPath = getAlovaJsonPath(workspaceRootDir, outputPath);
  // 获取alova版本
  const configVersion = Number(config.version);
  const alovaVersion: AlovaVersion = Number.isNaN(configVersion)
    ? getAlovaVersion(workspaceRootDir)
    : `v${configVersion}`;
  const templateFile = new TemplateFile(type, alovaVersion);
  // 将openApi对象转成template对象
  const templateData = await openApi2Data(data, config);
  // 框架技术栈标签  vue | react
  templateData[getFrameworkTag(workspaceRootDir)] = true;
  // 头部注释部分
  templateData.commentText = await templateFile.readAndRenderTemplate('comment', data, {
    root: true,
    hasVersion: false
  });
  // 模块类型
  templateData.moduleType = TemplateFile.getModuleType(type);
  // 模板类型
  templateData.type = type;
  // alova版本
  templateData.alovaVersion = alovaVersion;
  // 是否需要生成api文件
  // 判断是否需要生成api文件
  if (!force && isEqual(templateData, DEFAULT_CONFIG.templateData.get(alovaJsonPath))) {
    return false;
  }
  // 保存templateData
  DEFAULT_CONFIG.templateData.set(alovaJsonPath, templateData);
  // 生成alova.json文件
  await writeAlovaJson(templateData, alovaJsonPath);
  // 获取是否存在index.ts|index.js
  const indexIsExists = await existsPromise(path.join(outputDir, `index${templateFile.getExt()}`));
  // mustache语法生成
  // 定义模版配置对象
  const generatingPromises = [
    !indexIsExists
      ? {
          fileName: 'index'
        }
      : null,
    {
      fileName: 'createApis'
    },
    {
      fileName: 'apiDefinitions',
      root: true,
      hasVersion: false
    },
    {
      fileName: 'globals.d',
      ext: '.ts',
      root: true
    }
  ].map(item => {
    if (!item) {
      return;
    }
    const { fileName, ext, root, hasVersion } = item;
    return templateFile.outputFile(templateData, fileName, outputDir, { ext, root, hasVersion });
  });
  await Promise.all(generatingPromises);
  return true;
}
