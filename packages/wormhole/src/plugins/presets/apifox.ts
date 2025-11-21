import type { ApiPlugin } from '@/type'

export type ScopeType = 'ALL' | 'SELECTED_ENDPOINTS' | 'SELECTED_TAGS' | 'SELECTED_FOLDERS'

export interface APIFoxBody {
  scope?: {
    type?: ScopeType
    selectedEndpointIds?: number[]
    selectedTags?: string[]
    selectedFolderIds?: number[]
    excludedByTags?: string[]
  }
  options?: {
    includeApifoxExtensionProperties?: boolean
    addFoldersToTags?: boolean
  }
  oasVersion?: '2.0' | '3.0' | '3.1'
  exportFormat?: 'JSON' | 'YAML'
  environmentIds?: number[]
  branchId?: number
  moduleId?: number
}

export interface ApifoxOptions
  extends Pick<APIFoxBody, 'oasVersion' | 'exportFormat' | 'environmentIds' | 'branchId' | 'moduleId'>,
  Pick<
    NonNullable<APIFoxBody['options']>,
    'includeApifoxExtensionProperties' | 'addFoldersToTags'
  > {
  projectId: string
  apifoxToken: string
  locale?: string
  apifoxVersion?: string
  scopeType?: ScopeType
  selectedEndpointIds?: number[]
  selectedTags?: string[]
  selectedFolderIds?: number[]
  excludedByTags?: string[]
}

export function apifox({
  projectId,
  locale = 'zh-CN',
  apifoxVersion = '2024-03-28',
  scopeType = 'ALL',
  selectedEndpointIds = [],
  selectedTags = [],
  selectedFolderIds = [],
  excludedByTags = [],
  apifoxToken,
  oasVersion = '3.0',
  exportFormat = 'JSON',
  includeApifoxExtensionProperties = false,
  addFoldersToTags = false,
  environmentIds,
  branchId,
  moduleId,
}: ApifoxOptions): ApiPlugin {
  const body: APIFoxBody = {
    scope: {
      type: scopeType,
      excludedByTags,
    },
    options: {
      includeApifoxExtensionProperties,
      addFoldersToTags,
    },
    oasVersion,
    exportFormat,
    environmentIds,
    branchId,
    moduleId,
  }

  // 根据不同的 scope 类型设置相应的参数
  switch (scopeType) {
    case 'ALL':
      // 导出全部不需要额外参数
      break
    case 'SELECTED_ENDPOINTS':
      body.scope!.selectedEndpointIds = selectedEndpointIds
      break
    case 'SELECTED_TAGS':
      body.scope!.selectedTags = selectedTags
      break
    case 'SELECTED_FOLDERS':
      body.scope!.selectedFolderIds = selectedFolderIds
      break
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
