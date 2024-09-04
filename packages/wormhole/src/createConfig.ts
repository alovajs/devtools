import getAlovaVersion, { AlovaVersion } from './functions/getAlovaVersion';
import getAutoTemplateType from './functions/getAutoTemplateType';
import TemplateFile from './modules/TemplateFile';

export const createConfig = async (projectPath: string = process.cwd()) => {
  const type = getAutoTemplateType(projectPath);
  const alovaVersion: AlovaVersion = getAlovaVersion(projectPath);
  const templateFile = new TemplateFile(type, alovaVersion);
  return templateFile.outputFile({}, 'alova.config', projectPath, {
    root: true,
    hasVersion: false
  });
};
export default createConfig;
