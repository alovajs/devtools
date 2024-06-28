import path from 'node:path';
import { AUTO_COMPLETE } from '../components/autocomplete';
import { generateDefaultValues } from '../helper/typeStr';
import { CONFIG_POOL } from '../modules/Configuration';
import { TEMPLATE_DATA, getAlovaJsonPath } from '../modules/TemplateFile';
import { Api } from './openApi2Data';
type AutoCompleteItem = {
  replaceText: string;
  summary: string;
  documentation?: string;
  path: string;
  method: string;
};
const getApiDefultValue = (api: Api) => {
  let configStrArr: string[] = [];
  if (api.pathParametersComment) {
    configStrArr.push(`\n  pathParams: ${generateDefaultValues(api.pathParametersComment.replaceAll('*', ''))}`);
  }
  if (api.queryParametersComment) {
    configStrArr.push(`\n  params: ${generateDefaultValues(api.queryParametersComment.replaceAll('*', ''))}`);
  }
  if (api.requestComment) {
    configStrArr.push(`\n  data: ${generateDefaultValues(api.requestComment.replaceAll('*', ''))}`);
  }
  return `Apis.${api.pathKey}({${configStrArr.join(',')}${configStrArr.length ? '\n' : ''}})`;
};
const filterAutoCompleteItem = (text: string, apiArr: Api[]): AutoCompleteItem[] => {
  const autoCompleteArr: AutoCompleteItem[] = [];
  apiArr.forEach(api => {
    const replaceText = getApiDefultValue(api);
    if (api.path.includes(text)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.summary,
        path: api.path,
        method: api.method
      });
    }
    if (api.summary.includes(text)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.summary,
        method: api.method
      });
    }
    if (api.pathKey.includes(text)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.pathKey,
        documentation: api.summary,
        method: api.method
      });
    }
  });
  return autoCompleteArr;
};
export default (text: string): AutoCompleteItem[] => {
  const filePath = AUTO_COMPLETE.path;
  const config = CONFIG_POOL.find(item => {
    return filePath.includes(path.resolve(item.workspaceRootDir));
  });
  if (!config) {
    return [];
  }
  const outputArr = config?.getAllOutputPath() || [];
  return outputArr
    .map(output => {
      const apiPath = getAlovaJsonPath(config.workspaceRootDir, output);
      const templateData = TEMPLATE_DATA.get(apiPath);
      if (!templateData) {
        return [];
      }
      return templateData.pathApis.map(item => filterAutoCompleteItem(text, item.apis));
    })
    .flat(2);
};
