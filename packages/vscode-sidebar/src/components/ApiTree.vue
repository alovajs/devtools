<script setup lang="tsx">
import type { TreeOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Api, ApiProject, ApiType } from '@/types'
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

const { projects = [] } = defineProps<{
  projects?: ApiProject[]
}>()
interface ApiNode {
  id: string
  type: ApiType
  label: string
  api?: Api
  children?: ApiNode[]
}
const iconMap = readonly<Record<ApiType, () => VNodeChild>>({
  project() {
    return <NIcon><HardwareChipOutline /></NIcon>
  },
  server() {
    return <NIcon><ServerOutline /></NIcon>
  },
  group() {
    return <NIcon><Folder /></NIcon>
  },
  api() {
    return <NIcon><SwapVerticalOutline /></NIcon>
  },
})
const message = useMessage()
function nodeProps({ option }: { option: TreeOption }) {
  return {
    onClick() {
      if (!option.children && !option.disabled) {
        message.info(`[Click] ${option.label}`)
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
      type: 'project',
      label: project.name,
      children: serverNodes,
    })
    servers.forEach((groups, idx) => {
      const groupNodes: ApiNode[] = []
      const serverNode: ApiNode = {
        id: `server-${project.name}-${idx + 1}`,
        type: 'server',
        label: `Server ${idx + 1}`,
        children: groupNodes,
      }
      serverNodes.push(serverNode)
      groups.forEach((group, apiIdx) => {
        const apiNodes: ApiNode[] = []
        const groupNode: ApiNode = {
          id: `group-${project.name}-${idx + 1}-${apiIdx + 1}`,
          type: 'group',
          label: group.tag,
          children: apiNodes,
        }
        groupNodes.push(groupNode)
        group.apis.forEach((api) => {
          apiNodes.push({
            id: `${api.global}.${api.pathKey}`,
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
function renderLabel({ option }: { option: TreeOption }) {
  const api = option.api as Api | undefined
  const description = api ? `[${api?.method}]${api?.path}\n${api?.summary}` : ''
  return (
    <NPopover disabled={!description}>
      {{
        trigger: () => <span>{option.label}</span>,
        default: () => <pre>{description}</pre>,
      }}
    </NPopover>
  )
}
const data = computed(() => getData(getApiNode(projects)))
</script>

<template>
  <n-tree

    expand-on-click block-line
    :data="data"
    :render-label="renderLabel"
    :node-props="nodeProps"
  />
</template>
