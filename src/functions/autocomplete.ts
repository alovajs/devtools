import { CONFIG_POOL } from '../modules/Configuration';
import { TEMPLATE_DATA } from '../modules/TemplateFile';
import { AUTO_COMPLETE } from '../components/autocomplete';
import { Api } from './openApi2Data';
import path from 'node:path';
type AutoCompleteItem = {
  replaceText: string;
  summary: string;
  path: string;
  method: string;
};
const filterAutoCompleteItem = (text: string, apiArr: Api[]): AutoCompleteItem[] => {
  const autoCompleteArr: AutoCompleteItem[] = [];
  const autoCompleteSet = new Set();
  apiArr.forEach(api => {
    const replaceText = `Apis.${api.pathKey}`;
    if (autoCompleteSet.has(replaceText)) {
      return;
    }
    if (api.path.includes(text)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.summary,
        path: api.path,
        method: api.method
      });
      autoCompleteSet.add(replaceText);
      return;
    }
    if (api.summary.includes(text)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.summary,
        method: api.method
      });
      autoCompleteSet.add(replaceText);
      return;
    }
    if (api.pathKey.includes(text)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.pathKey,
        method: api.method
      });
      autoCompleteSet.add(replaceText);
      return;
    }
  });
  return autoCompleteArr;
};
export default (text: string): AutoCompleteItem[] => {
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
      const templateData = TEMPLATE_DATA.get(apiPath);
      if (!templateData) {
        return [];
      }
      return templateData.pathApis.map(item => filterAutoCompleteItem(text, item.apis));
    })
    .flat(2);
};
