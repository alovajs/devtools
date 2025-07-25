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
import { match } from 'sdm2'

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

const { t } = useI18n()

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
function normalizeTree(node: ApiNode) {
  // 先递归处理所有子节点，确保子树已规范化
  for (const child of node.children ?? []) {
    normalizeTree(child)
  }

  // 检查当前节点是否需要调整
  if (node.children?.length === 1) {
    const child = node.children[0]
    // 如果唯一的子节点还有子节点（非叶子）
    if (child?.children?.length) {
      // 将子节点的子节点提升到当前节点
      node.children = child.children
      // 递归处理调整后的当前节点，可能仍需进一步调整
      normalizeTree(node)
    }
  }
  // 其他情况（0个子或1个叶子子节点，或多于1个子节点）无需处理
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
function filter(pattern: string, node: TreeOption) {
  const result = getMachResult(pattern, node)
  if (result) {
    node.description = result.str
    node.filterLabel = result.str.split('\n')[0]
  }
  else {
    node.description = ''
    node.filterLabel = ''
  }
  return result !== null
}
function getMachResult(pattern: string, node: TreeOption) {
  const strings: string[] = []
  if (node.label) {
    strings.push(node.label)
  }
  const api = node?.api as Api
  if (api) {
    strings.push(`${api.global}.${api.pathKey}`)
    if (api.summary) {
      strings.push(api.summary)
    }
  }
  return match(strings.join('\n'), pattern, {
    onMatched(matchedStr) {
      return `<span class="text-green-500">${matchedStr}</span>`
    },
  })
}
function getDescription(option: TreeOption) {
  const api = option.api as Api | undefined
  if (!api) {
    return ''
  }
  if (pattern && option.description) {
    return option.description
  }
  return `[${api?.method}]${api?.path}\n${api.global}.${api.pathKey}\n${api?.summary}`
}
function getLabel(option: TreeOption) {
  if (pattern && option.filterLabel) {
    return option.filterLabel
  }
  return option.label
}
function renderLabel({ option }: { option: TreeOption }) {
  const description = getDescription(option)
  return (
    <NPopover disabled={!description} style="max-width: 300px" placement="top-start">
      {{
        trigger: () => <span v-html={getLabel(option)}></span>,
        default: () => (
          <pre style="white-space: pre-wrap; word-wrap: break-word;">
            <div v-html={description}></div>
          </pre>
        ),
      }}
    </NPopover>
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
  normalizeTree(root)
  // eslint-disable-next-line no-console
  console.log(root, 271)

  return getData(root.children ?? [])
})
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
    v-model:selected-keys="selectedKeys"
    v-model:expanded-keys="expandedKeys"
    expand-on-click
    block-line
    :data="data"
    :show-irrelevant-nodes="false"
    :pattern="pattern"
    :render-label="renderLabel"
    :node-props="nodeProps"
    :filter="filter"
  >
    <template #empty>
      <n-empty
        :description="t('api-info.empty')"
        class="h-full flex-justify-center"
      />
    </template>
  </n-tree>
</template>
