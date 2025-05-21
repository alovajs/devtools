import type { TemplateType } from '@/type/base';
import path from 'node:path';
import getAlovaVersion, { AlovaVersion } from './functions/getAlovaVersion';
import getAutoTemplateType from './functions/getAutoTemplateType';
import TemplateFile from './modules/TemplateFile';

interface ConfigCreationOptions {
  projectPath?: string;
  type?: TemplateType;
}

/**
 * create a templated configuration file
 * @param options config file create options
 * @returns Promise<void>
 */
const createConfig = ({ projectPath = '', type }: ConfigCreationOptions = {}) => {
  projectPath = path.isAbsolute(projectPath) ? projectPath : path.resolve(process.cwd(), projectPath);
  type = type || getAutoTemplateType(projectPath);
  const moduleType = TemplateFile.getModuleType(type);
  const alovaVersion: AlovaVersion = getAlovaVersion(projectPath);
  const templateFile = new TemplateFile(type, alovaVersion);
  return templateFile.outputFile({ type, moduleType }, 'alova.config', projectPath, {
    root: true,
    hasVersion: false
  });
};
export default createConfig;
