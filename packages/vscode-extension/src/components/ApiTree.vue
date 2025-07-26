<script setup lang="tsx">
import type { TreeOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Api, ApiProject, ApiType, MethodType } from '~/types'
import {
  Folder,
  HardwareChipOutline,
  ServerOutline,
  SwapVerticalOutline,
} from '@vicons/ionicons5'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { useTreeNode } from '~/hooks/use-tree-node'
import { handleCopy } from '~/utils/web'
import ApiMethod from './ApiMethod.vue'

defineOptions({
  name: 'ApiTree',
})

const { projects = [], pattern = '' } = defineProps<{
  projects?: ApiProject[]
  pattern?: string
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

const iconMap = readonly<Record<ApiType, () => VNodeChild>>({
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
  api() {
    return (
      <NIcon>
        <SwapVerticalOutline />
      </NIcon>
    )
  },
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
      <ApiMethod method={api.method as MethodType} html={method} />
      <span class="ml-2" v-html={url} />
      <div v-html={rest.join('\n')} />
    </>
  )
}
function getDescription(option: TreeOption) {
  const api = option.api as Api | undefined
  if (!api) {
    return ''
  }
  if (pattern && option.description) {
    return option.description as string
  }
  return `${api?.method}\n${api?.path}\n${api.global}.${api.pathKey}\n${api?.summary}`
}
function getLabel(option: TreeOption) {
  if (pattern && option.filterLabel) {
    return option.filterLabel as string
  }
  return option.label ?? ''
}

function renderLabel({ option }: { option: TreeOption }) {
  const description = getDescription(option)
  return (
    <div>
      <NPopover disabled={!description} style="max-width: 300px" placement="top-start">
        {{
          trigger: () => <div data-key={option.key}>{strRender(getLabel(option), option)}</div>,
          default: () => (
            <pre style="white-space: pre-wrap; word-wrap: break-word;">
              {strRender(description, option)}
            </pre>
          ),
        }}
      </NPopover>
    </div>
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
          <i class="i-carbon-copy" />
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
        <n-empty :description="t('api-info.empty')" class="h-full flex-justify-center" />
      </template>
    </n-tree>
  </div>
</template>
