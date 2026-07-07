<<<<<<< HEAD
import type { Api } from 'wormajs'
import { match } from 'sdm2'
import { getApis } from './getApis'

interface AutoCompleteItem {
  replaceText: string
  summary: string
  documentation?: string
  path: string
  method: string
}

function filterAutoCompleteItem(text: string, apiArr: Api[]): AutoCompleteItem[] {
  const autoCompleteArr: AutoCompleteItem[] = []
  const filter = (text: string, otherText: string) => !!match(otherText, text, { ignoreCase: true })
  apiArr.forEach((api) => {
    const replaceText = api.callingCode ?? ''
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
    if (filter(text, api.name)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.name,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method,
      })
    }
  })
  return autoCompleteArr
}
export default async (text: string, filePath: string): Promise<AutoCompleteItem[]> =>
  filterAutoCompleteItem(text, await getApis(filePath))
=======
import type { Api } from 'wormajs'
import { match } from 'sdm2'
import { getApis } from './getApis'

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
    const replaceText = api.callingCode ?? ''
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
    if (filter(text, api.name)) {
      autoCompleteArr.push({
        replaceText,
        summary: api.path,
        path: api.name,
        documentation: `${api.summary}\n\`\`\`typescript\n${replaceText}\`\`\``,
        method: api.method,
      })
    }
  })
  return autoCompleteArr
}
export default async (text: string, filePath: string): Promise<AutoCompleteItem[]> =>
  filterAutoCompleteItem(text, await getApis(filePath))
>>>>>>> 34d1b7a6dd824d678058d9aefd1074dd8f01226b
