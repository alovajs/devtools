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
  workspaceRootDir: string, // Project address

  outputPath: string, // Output path

  data: OpenAPIV3_1.Document, // Openapidata

  config: GeneratorConfig, // Generator configuration

  type: TemplateType, // template type

  force: boolean // Whether to force generation
) {
  if (!data) {
    return false;
  }
  // Output directory

  const outputDir = path.resolve(workspaceRootDir, outputPath);
  // Cache file address

  const alovaJsonPath = getAlovaJsonPath(workspaceRootDir, outputPath);
  // Get alova version

  const configVersion = Number(config.version);
  const alovaVersion: AlovaVersion = Number.isNaN(configVersion)
    ? getAlovaVersion(workspaceRootDir)
    : `v${configVersion}`;
  const templateFile = new TemplateFile(type, alovaVersion);
  // Convert open api object to template object

  const templateData = await openApi2Data(data, config);
  // Framework technology stack tag vue | react

  templateData[getFrameworkTag(workspaceRootDir)] = true;
  // Header annotation section

  templateData.commentText = await templateFile.readAndRenderTemplate('comment', data, {
    root: true,
    hasVersion: false
  });
  // module type

  templateData.moduleType = TemplateFile.getModuleType(type);
  // template type

  templateData.type = type;
  // Alova version

  templateData.alovaVersion = alovaVersion;
  // Do you need to generate api files?

  if (!force && isEqual(templateData, DEFAULT_CONFIG.templateData.get(alovaJsonPath))) {
    return false;
  }
  // Generate alova.json file
  await writeAlovaJson(templateData, alovaJsonPath);
  // Save template data
  DEFAULT_CONFIG.templateData.set(alovaJsonPath, templateData);
  // Get whether index.ts|index.js exists
  const indexIsExists = await existsPromise(path.join(outputDir, `index${templateFile.getExt()}`));
  // mustache grammar generation
  // Define template configuration objects

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
