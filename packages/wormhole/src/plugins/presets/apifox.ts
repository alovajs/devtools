import type { ApiPlugin } from '@/type'
import { isEmpty } from 'lodash'

export interface APIFoxBody {
  scope?: {
    type?: 'ALL' | 'SELECTED_TAGS'
    selectedTags?: string[]
    excludedByTags?: string[]
  }
  options?: {
    includeApifoxExtensionProperties?: boolean
    addFoldersToTags?: boolean
  }
  oasVersion?: '2.0' | '3.0' | '3.1'
  exportFormat?: 'JSON' | 'YAML'
  environmentIds?: string[]
}

export interface ApifoxOptions
  extends Pick<APIFoxBody, 'oasVersion' | 'exportFormat'>,
  Pick<
    NonNullable<APIFoxBody['options']>,
      'includeApifoxExtensionProperties' | 'addFoldersToTags'
  > {
  projectId: string
  apifoxToken: string
  locale?: string
  apifoxVersion?: string
  selectedTags?: string[]
  excludedByTags?: string[]
}
export function apifox({
  projectId,
  locale = 'zh-CN',
  apifoxVersion = '2024-03-28',
  selectedTags,
  excludedByTags = [],
  apifoxToken,
  oasVersion = '3.0',
  exportFormat = 'JSON',
  includeApifoxExtensionProperties = false,
  addFoldersToTags = false,
}: ApifoxOptions): ApiPlugin {
  const body: APIFoxBody = {
    scope: {
      excludedByTags,
    },
    options: {
      includeApifoxExtensionProperties,
      addFoldersToTags,
    },
    oasVersion,
    exportFormat,
  }
  if (!body.scope) {
    body.scope = {}
  }
  const tags = !isEmpty(selectedTags) ? selectedTags : '*'
  if (tags === '*') {
    body.scope.type = 'ALL'
  }
  else {
    body.scope.type = 'SELECTED_TAGS'
    body.scope.selectedTags = tags
  }
  return {
    name: 'apifox',
    config(config) {
      const base = 'https://api.apifox.com/v1/projects'
      if (projectId && apifoxToken) {
        config.input = `${base}/${encodeURIComponent(projectId)}/export-openapi?locale=${encodeURIComponent(locale)}`
        config.fetchOptions = {
          ...config.fetchOptions,
          headers: {
            'X-Apifox-Api-Version': apifoxVersion,
            'Authorization': `Bearer ${apifoxToken}`,
          },
          method: 'POST',
          data: body,
        }
      }
      return config
    },
  }
}

export default apifox
