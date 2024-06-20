import { CONFIG_POOL } from '../modules/Configuration';
import { TEMPLATE_DATA } from '../modules/TemplateFile';
import { AUTO_COMPLETE } from '../components/autocomplete';
import path from 'node:path';
export default (text: string): string[] => {
  const filePath = AUTO_COMPLETE.path;
  const config = CONFIG_POOL.find(item => {
    return filePath.includes(item.workspaceRootDir);
  });
  if (!config) {
    return [];
  }
  const outputArr = config?.getAllOutputPath() || [];
  return outputArr
    .map(output => {
      const apiPath = path.join(config.workspaceRootDir, output);
      const templateData = TEMPLATE_DATA[apiPath];
      if (!templateData) {
        return [];
      }
      return templateData.pathsArr.map(item => `Apis.${item.key}`).filter(key => key.includes(text));
    })
    .flat();
};
