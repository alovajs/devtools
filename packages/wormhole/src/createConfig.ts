import getAlovaVersion from '@/functions/getAlovaVersion';
import getAutoTemplateType from '@/functions/getAutoTemplateType';
import { templateHelper } from '@/helper';
import type { TemplateType } from '@/type/lib';
import path from 'node:path';

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
  templateHelper.load({
    type,
    version: getAlovaVersion(projectPath)
  });
  return templateHelper.outputFile({
    fileName: 'alova.config',
    data: {
      type,
      moduleType: templateHelper.getModuleType()
    },
    output: projectPath,
    root: true,
    hasVersion: false
  });
};
export default createConfig;
