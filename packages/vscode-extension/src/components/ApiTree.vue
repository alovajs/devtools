<script setup lang="tsx">
import type { TreeOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Api, ApiProject, ApiType, MethodType } from '~/types'
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
    const servers = project.apiDocs
    const serverNodes: ApiNode[] = []
    nodes.push({
      id: project.name,
      level: 1,
      type: 'project',
      label: project.name,
      children: serverNodes,
    })
    servers.forEach((groups, idx) => {
      const groupNodes: ApiNode[] = []
      const serverNode: ApiNode = {
        id: `server-${project.name}-${idx + 1}`,
        level: 2,
        type: 'server',
        label: `Server ${idx + 1}`,
        children: groupNodes,
      }
      serverNodes.push(serverNode)
      groups.forEach((group, apiIdx) => {
        const apiNodes: ApiNode[] = []
        const groupNode: ApiNode = {
          id: `group-${project.name}-${idx + 1}-${apiIdx + 1}`,
          level: 3,
          type: 'group',
          label: group.tag,
          children: apiNodes,
        }
        groupNodes.push(groupNode)
        group.apis.forEach((api) => {
          apiNodes.push({
            id: `${api.global}.${api.pathKey}`,
            level: 4,
            type: 'api',
            label: `${api.method}\n${api.path}`,
            api,
          })
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
    data.push({
      key: apiNode.id,
      label: apiNode.label,
      prefix: iconMap[apiNode.type],
      api: apiNode.api,
      children,
      disabled: !children && !apiNode.api,
    })
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
        strings.push(`${api.global}.${api.pathKey}`)
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
      <ApiMethod method={api.method as MethodType} html={method} style="--n-padding: 0 4px; --n-font-size: 8px; --n-height: 16px;" />
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
  return (
    <div class="flex items-center" data-key={option.key}>{strRender(getLabel(option), option)}</div>
  )
}

function renderSuffix({ option }: { option: TreeOption }) {
  const api = option.api as Api | undefined
  if (!api || hoverKey.value !== option.key) {
    return
  }
  return (
    <NButton
      text
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        handleCopy(api.defaultValue ?? '')
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

defineExpose({
  getApi(key: string) {
    return treeHelper.getNodeById(key, data.value).result?.api as Api | null
  },
  selectApi(key: string) {
    selectNode(key, data.value)
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
      :data="data"
      :show-irrelevant-nodes="false"
      :pattern="pattern"
      :render-label="renderLabel"
      :render-suffix="renderSuffix"
      :node-props="nodeProps"
      :filter="filter"
    >
      <template #empty>
        <div class="mt-24 h-full flex items-center justify-center">
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
