import getAlovaVersion, { AlovaVersion } from '@/wormhole/functions/getAlovaVersion';
import getAutoTemplateType from '@/wormhole/functions/getAutoTemplateType';
import TemplateFile from '@/wormhole/modules/TemplateFile';

export const createConfig = async (projectPath: string) => {
  const type = getAutoTemplateType(projectPath);
  const alovaVersion: AlovaVersion = getAlovaVersion(projectPath);
  const templateFile = new TemplateFile(type, alovaVersion);
  return templateFile.outputFile({}, 'alova.config', projectPath, {
    root: true,
    hasVersion: false
  });
};
export default createConfig;
