import getAlovaVersion, { AlovaVersion } from '@/functions/getAlovaVersion';
import getAutoTemplateType from '@/functions/getAutoTemplateType';
import { TemplateFile } from '@/modules/TemplateFile';

export const createConfig = async (projectPath: string) => {
  const type = getAutoTemplateType(projectPath);
  const alovaVersion: AlovaVersion = getAlovaVersion(projectPath);
  const templateFile = new TemplateFile(type, alovaVersion);
  return templateFile.outputFile({}, 'alova.config', projectPath, {
    root: true,
    ext: '.ts',
    hasVersion: false
  });
};
export default createConfig;
