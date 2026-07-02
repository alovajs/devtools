<script setup lang="tsx">
import type { TreeOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Api, ApiProject, ApiType, CacheData, MethodType } from '~/types'
import {
  Folder,
  HardwareChipOutline,
  ServerOutline,
} from '@vicons/ionicons5'
import { NButton, NIcon } from 'naive-ui'
import { useTreeNode } from '~/hooks/use-tree-node'
import { handleCopy } from '~/utils/web'
import ApiMethod from './ApiMethod.vue'

defineOptions({
  name: 'ApiTree',
})

const { projects = [], pattern = '' } = defineProps<{
  projects?: ApiProject[]
  pattern?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', api: Api): void
}>()

interface ApiNode extends TreeOption {
  id: string
  level: number
  type: ApiType
  label: string
  api?: Api
  children?: ApiNode[]
}
const { t } = useI18n()

const selectedKeys = defineModel<string[]>('selected', { default: [] })
const expandedKeys = defineModel<string[]>('expanded', { default: [] })
const hoverKey = ref('')

const iconMap = readonly<Record<ApiType, (() => VNodeChild) | undefined>>({
  project() {
    return (
      <NIcon>
        <HardwareChipOutline />
      </NIcon>
    )
  },
  server() {
    return (
      <NIcon>
        <ServerOutline />
      </NIcon>
    )
  },
  group() {
    return (
      <NIcon>
        <Folder />
      </NIcon>
    )
  },
  api: undefined,
})

const { treeRef, treeKey, selectNode, treeHelper } = useTreeNode({
  setExpandedKeys(keys) {
    expandedKeys.value = keys
  },
  setSelectedKeys(keys) {
    selectedKeys.value = keys
  },
})
const offHover = treeHelper.setupHover((target, setHover) => {
  const keyDom = target.querySelector('[data-key]')
  if (!keyDom) {
    return
  }
  const datakey = keyDom.getAttribute('data-key')
  if (hoverKey.value !== datakey && datakey) {
    setHover(datakey)
  }
}).onHover((key) => {
  hoverKey.value = key
})

onUnmounted(offHover)

function nodeProps({ option }: { option: TreeOption }) {
  return {
    onClick() {
      if (!option.children && !option.disabled && option.api) {
        emit('select', option.api as Api)
      }
    },
  }
}
function getApiNode(projects: ApiProject[]) {
  const nodes: ApiNode[] = []
  for (const project of projects) {
    const serverNodes: ApiNode[] = []
    nodes.push({
      id: project.name,
      level: 1,
      type: 'project',
      label: project.name,
      children: serverNodes,
    })
    project.servers.forEach((server: CacheData, idx: number) => {
      const serverLabel = server.serverName || server.path.split(/[/\\]/).filter(Boolean).pop() || server.path
      const groupNodes: ApiNode[] = []
      const serverNode: ApiNode = {
        id: `server-${project.name}-${idx}`,
        level: 2,
        type: 'server',
        label: serverLabel,
        children: groupNodes,
      }
      ;(serverNode as any).serverPath = server.path
      serverNodes.push(serverNode)
      const tagMap = new Map<string, Api[]>()
      for (const api of server.apis) {
        if (!tagMap.has(api.tag)) {
          tagMap.set(api.tag, [])
        }
        tagMap.get(api.tag)!.push(api)
      }
      let tagIdx = 0
      tagMap.forEach((apis, tag) => {
        const apiNodes: ApiNode[] = apis.map(api => ({
          id: `${project.name}/${idx}/${api.name}`,
          level: 4,
          type: 'api' as ApiType,
          label: `${api.method}\n${api.path}`,
          api,
        }))
        groupNodes.push({
          id: `group-${project.name}-${idx}-${tagIdx++}`,
          level: 3,
          type: 'group',
          label: tag,
          children: apiNodes,
        })
      })
    })
  }
  return nodes
}
function getData(apis: ApiNode[]): TreeOption[] {
  const data: TreeOption[] = []
  for (const apiNode of apis) {
    const children = apiNode.children ? getData(apiNode.children) : undefined
    const option: TreeOption & { nodeType?: ApiType, serverPath?: string } = {
      key: apiNode.id,
      label: apiNode.label,
      prefix: iconMap[apiNode.type],
      api: apiNode.api,
      children,
      disabled: !children && !apiNode.api,
      nodeType: apiNode.type,
    }
    // Store server path for server nodes
    if (apiNode.type === 'server') {
      ;(option as any).serverPath = (apiNode as any).serverPath
    }
    data.push(option)
  }
  return data
}
function filter(pattern: string, node: TreeOption) {
  const result = treeHelper.match(pattern, node, {
    onMatch(node) {
      const strings: string[] = []
      const api = node?.api as Api
      if (node.label) {
        strings.push(node.label)
      }
      if (api) {
        strings.push(api.name)
        if (api.summary) {
          strings.push(api.summary)
        }
      }
      return strings
    },
    ignoreCase: true,
    onMatched(matchedStr) {
      return `<span class="text-green-5">${matchedStr}</span>`
    },
  })
  if (result) {
    const [method, path] = result.str.split('\n')
    node.description = result.str
    node.filterLabel = `${method}\n${path}`
  }
  else {
    node.description = ''
    node.filterLabel = ''
  }
  return result !== null
}
function strRender(str: string, option: TreeOption) {
  const api = option.api as Api | undefined
  if (!api) {
    return <div v-html={str} />
  }
  const [method, url, ...rest] = str.split('\n')
  return (
    <>
      <ApiMethod method={api.method as MethodType} html={method} style="--n-padding: 0 6px; --n-font-size: 10px; --n-height: 18px;" />
      <span class="ml-2" v-html={url} />
      <div v-html={rest.join('\n')} />
    </>
  )
}
function getLabel(option: TreeOption) {
  if (pattern && option.filterLabel) {
    return option.filterLabel as string
  }
  return option.label ?? ''
}

function renderLabel({ option }: { option: TreeOption }) {
  const nodeOpt = option as TreeOption & { nodeType?: ApiType, serverPath?: string }
  const api = nodeOpt.api as Api | undefined
  const nodeType = nodeOpt.nodeType
  const serverPath = nodeOpt.serverPath

  // Build tooltip for server nodes (show full URL) and API nodes (show summary)
  let tooltip: string | undefined
  if (nodeType === 'server' && serverPath) {
    tooltip = serverPath
  }
  else if (nodeType === 'api' && api?.summary) {
    tooltip = api.summary
  }

  return (
    <div
      class="flex items-center gap-1.5"
      data-key={option.key}
      title={tooltip}
    >
      {strRender(getLabel(option as TreeOption), option)}
    </div>
  )
}

function countLeafApis(node: TreeOption): number {
  if (node.api)
    return 1
  if (!node.children?.length)
    return 0
  return (node.children as TreeOption[]).reduce((sum, child) => sum + countLeafApis(child), 0)
}

function renderSuffix({ option }: { option: TreeOption }) {
  const api = option.api as Api | undefined
  if (!api) {
    // Show API count for group/server/project nodes
    const count = countLeafApis(option)
    if (count > 0) {
      return <span class="tree-count-badge">{count}</span>
    }
    return
  }
  if (hoverKey.value !== option.key) {
    return
  }
  return (
    <NButton
      text
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        handleCopy(api.callingCode ?? '')
      }}
    >
      {{
        icon: () => (
          <i class="i-carbon-copy text-sm" />
        ),
      }}
    </NButton>
  )
}
const data = computed(() => {
  const apiNodes = getApiNode(projects)
  const root: ApiNode = {
    id: 'root',
    level: 0,
    type: 'project',
    label: 'root',
    children: apiNodes,
  }
  treeHelper.normalizeTree(root)
  return getData(root.children ?? [])
})

function findNodeBySuffix(nodes: TreeOption[], suffix: string): TreeOption | null {
  for (const node of nodes) {
    if (node.key && String(node.key).endsWith(suffix) && node.api) {
      return node
    }
    if (node.children?.length) {
      const found = findNodeBySuffix(node.children as TreeOption[], suffix)
      if (found)
        return found
    }
  }
  return null
}

defineExpose({
  getApi(key: string) {
    // 优先精确匹配（新格式: projectName/serverIndex/global.name）
    const exact = treeHelper.getNodeById(key, data.value).result
    if (exact?.api)
      return exact.api as Api | null
    // 回退：按后缀模糊匹配（兼容旧格式: .global.name）
    return findNodeBySuffix(data.value, key)?.api as Api | null
  },
  selectApi(key: string) {
    const exact = treeHelper.getNodeById(key, data.value).result
    if (exact) {
      selectNode(key, data.value)
    }
    else {
      // 回退：按后缀模糊匹配
      const node = findNodeBySuffix(data.value, key)
      if (node?.key) {
        selectNode(node.key as string, data.value)
      }
    }
  },
})
</script>

<template>
  <div
    @mouseleave="treeHelper.handleMouseLeave"
    @mousemove="treeHelper.handleMouseMove"
  >
    <n-tree
      ref="treeRef"
      :key="treeKey"
      v-model:selected-keys="selectedKeys"
      v-model:expanded-keys="expandedKeys"
      expand-on-click
      block-line
      :data
      :show-irrelevant-nodes="false"
      :pattern
      :render-label
      :render-suffix
      :node-props
      :filter
    >
      <template #empty>
        <div class="h-full flex items-center justify-center">
          <template v-if="loading">
            <n-spin :size="14" class="mr-3" />
            <span>{{ $t('loading') }}</span>
          </template>
          <n-empty v-else :description="t('api-info.empty')" />
        </div>
      </template>
    </n-tree>
  </div>
</template>
