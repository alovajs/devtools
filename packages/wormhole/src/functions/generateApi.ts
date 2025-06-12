import { getGlobalConfig } from '@/config';
import { TemplateParser } from '@/core/parser';
import { GeneratorHelper } from '@/infrastructure/config/GeneratorHelper';
import type { GeneratorConfig, TemplateType } from '@/infrastructure/config/types';
import { TemplateHelper, type OutputFileOptions } from '@/infrastructure/template/TemplateHelper';
import { existsPromise } from '@/utils';
import { isEqual } from 'lodash';
import path from 'node:path';
import { OpenAPIV3_1 } from 'openapi-types';
import { getAlovaJsonPath, writeAlovaJson } from './alovaJson';

const DEFAULT_CONFIG = getGlobalConfig();
export default async function (
  projectPath: string, // Project address
  outputPath: string, // Output path
  data: OpenAPIV3_1.Document, // Openapidata
  config: GeneratorConfig, // Generator configuration
  type: TemplateType, // template type
  force: boolean // Whether to force generation
) {
  if (!data) {
    return false;
  }
  const output = path.resolve(projectPath, outputPath);
  const alovaJsonPath = getAlovaJsonPath(projectPath, outputPath);
  const version = GeneratorHelper.getAlovaVersion(config, projectPath);

  const templateHelper = TemplateHelper.load({
    type,
    version
  });

  const templateData = await new TemplateParser().parse(data, { projectPath, outputPath, generatorConfig: config });
  // Do you need to generate api files?

  if (!force && isEqual(templateData, DEFAULT_CONFIG.templateData.get(alovaJsonPath))) {
    return false;
  }
  // Generate alova.json file
  await writeAlovaJson(templateData, alovaJsonPath);
  // Save template data
  DEFAULT_CONFIG.templateData.set(alovaJsonPath, templateData);
  const generateFiles: OutputFileOptions[] = [
    {
      fileName: 'createApis',
      data: templateData,
      output
    },
    {
      fileName: 'apiDefinitions',
      data: templateData,
      output,
      root: true,
      hasVersion: false
    },
    {
      fileName: 'globals.d',
      data: templateData,
      output,
      ext: '.ts',
      root: true
    }
  ];
  if (!(await existsPromise(path.join(output, `index${templateHelper.getExt()}`)))) {
    generateFiles.push({
      fileName: 'index',
      data: templateData,
      output
    });
  }
  await templateHelper.outputFiles(generateFiles);
  return true;
}
