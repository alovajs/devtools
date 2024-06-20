import { CONFIG_POOL } from '../modules/Configuration';
import { TemplateFile } from '../modules/TemplateFile';
import { AUTO_COMPLETE } from '../components/autocomplete';
import path from 'node:path';
export default async (test: string): Promise<string[]> => {
  const filePath = AUTO_COMPLETE.path;
  const config = CONFIG_POOL.find(item => {
    return filePath.includes(item.workspaceRootDir);
  });
  if (!config) {
    return [];
  }
  const outputArr = config?.getAllOutputPath() || [];
  const templateType = config.getAllTemplateType();
  const apiDefinitionsPromise = outputArr.map((output, idx) => {
    const ext = TemplateFile.getExt(templateType[idx]);
    const apiPath = path.resolve(config.workspaceRootDir, output, `./apiDefinitions${ext}`);
    const configUrl = new URL(`file://${apiPath}`);
    return require(configUrl.href);
  });
  const apiDefinitionsArr = await Promise.all(apiDefinitionsPromise);
  console.log(apiDefinitionsArr, apiDefinitionsPromise, 22);

  return [
    'Apis.clients.generateFromURL',
    'Apis.servers.generateFromURL',
    'Apis.documentation.generateFromURL',
    'Apis.config.generateFromURL'
  ];
};
