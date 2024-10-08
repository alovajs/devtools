import { CONFIG_POOL } from '@/modules/Configuration';
import { TEMPLATE_DATA, getAlovaJsonPath } from '@/modules/TemplateFile';
import path from 'node:path';
import { Api } from './openApi2Data';

type AutoCompleteItem = {
  replaceText: string;
  summary: string;
  documentation?: string;
  path: string;
  method: string;
};

const filterAutoCompleteItem = (text: string, apiArr: Api[]): AutoCompleteItem[] => {
  const autoCompleteArr: AutoCompleteItem[] = [];
  const filter = (text: string, otherText: string) => otherText.includes(text);
  apiArr.forEach(api => {
    const replaceText = api.defaultValue ?? '';
    if (filter(text, api.path)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.path,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method
      });
    }
    if (filter(text, api.summary)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.summary,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method
      });
    }
    if (filter(text, `${api.global}.${api.pathKey}`)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: `${api.global}.${api.pathKey}`,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method
      });
    }
  });
  return autoCompleteArr;
};
export default (text: string, filePath: string): AutoCompleteItem[] => {
  const config = CONFIG_POOL.find(item => filePath.includes(path.resolve(item.workspaceRootDir)));
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
