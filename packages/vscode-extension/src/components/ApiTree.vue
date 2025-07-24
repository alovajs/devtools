<script setup lang="tsx">
import type { TreeInst, TreeOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Api, ApiProject, ApiType } from '~/types'
import {
  Folder,
  HardwareChipOutline,
  ServerOutline,
  SwapVerticalOutline,
} from '@vicons/ionicons5'
import { NIcon, NPopover } from 'naive-ui'

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
const selectedKeys = defineModel<string[]>('selected', { default: [] })
const expandedKeys = defineModel<string[]>('expanded', { default: [] })
interface ApiNode {
  id: string
  level: number
  type: ApiType
  label: string
  api?: Api
  children?: ApiNode[]
}
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

const treeRef = ref<TreeInst | null>(null)
const treeKey = ref(0)
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
            label: `[${api.method}]${api.path}`,
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
function getNodeById(
  id: string,
  data: TreeOption[],
  path: Set<string> = new Set(),
) {
  let result: TreeOption | null = null
  let keys: string[] = []
  for (const node of data) {
    if (node.key) {
      path.add(`${node.key}`)
    }
    if (node.key === id) {
      result = node
      keys = [...path]
      break
    }
    if (node.children?.length) {
      const { result: nextResult, keys: nextKeys } = getNodeById(
        id,
        node.children,
        path,
      )
      result = nextResult
      keys = nextKeys
    }
    if (result) {
      break
    }
    path.delete(`${node.key}`)
    keys = []
  }
  return {
    result,
    keys,
  } as {
    result: TreeOption | null
    keys: string[]
  }
}
function renderLabel({ option }: { option: TreeOption }) {
  const api = option.api as Api | undefined
  const description = api
    ? `[${api?.method}]${api?.path}\n${api?.summary}`
    : ''
  return (
    <NPopover disabled={!description}>
      {{
        trigger: () => <span class="sticky top-50">{option.label}</span>,
        default: () => <pre>{description}</pre>,
      }}
    </NPopover>
  )
}
const data = computed(() => getData(getApiNode(projects)))
defineExpose({
  getApi(key: string) {
    const { result: node } = getNodeById(key, data.value)
    return node?.api as Api | null
  },
  selectApi(key: string) {
    const { result, keys } = getNodeById(key, data.value)
    if (result) {
      selectedKeys.value = [key]
      expandedKeys.value = keys
      treeRef.value?.scrollTo({ key })
      nextTick(() => {
        treeKey.value++
      })
    }
  },
})
</script>

<template>
  <n-tree
    ref="treeRef"
    :key="treeKey"

    expand-on-click virtual-scroll block-line
    :data="data"
    :selected-keys="selectedKeys"
    :expanded-keys="expandedKeys"
    :show-irrelevant-nodes="false"
    :pattern="pattern"
    :render-label="renderLabel"
    :node-props="nodeProps"
    @update-selected-keys="selectedKeys = $event"
    @update-expanded-keys="expandedKeys = $event"
  >
    <template #empty>
      <n-empty
        description="你什么也找不到"
        class="h-full flex-justify-center"
      />
    </template>
  </n-tree>
</template>
