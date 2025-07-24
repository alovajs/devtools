import type { Api } from '@alova/wormhole'
import { match } from 'sdm2'
import getApis from './getApis'

interface AutoCompleteItem {
  replaceText: string
  summary: string
  documentation?: string
  path: string
  method: string
}

function filterAutoCompleteItem(text: string, apiArr: Api[]): AutoCompleteItem[] {
  const autoCompleteArr: AutoCompleteItem[] = []
  const filter = (text: string, otherText: string) => !!match(otherText, text)
  apiArr.forEach((api) => {
    const replaceText = api.defaultValue ?? ''
    if (filter(text, api.path)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.path,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method,
      })
    }
    if (filter(text, api.summary)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.summary,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method,
      })
    }
    if (filter(text, `${api.global}.${api.pathKey}`)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: `${api.global}.${api.pathKey}`,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method,
      })
    }
  })
  return autoCompleteArr
}
export default async (text: string, filePath: string): Promise<AutoCompleteItem[]> =>
  filterAutoCompleteItem(text, await getApis(filePath))
