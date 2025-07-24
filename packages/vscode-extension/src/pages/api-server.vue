<script setup lang="ts">
import type ApiTree from '~/components/ApiTree.vue'
import type { Api, ApiProject } from '~/types'
import { MType, useHandlers } from '~/hooks/use-handlers'
import { useVscodeMessage } from '~/hooks/use-message'

defineOptions({
  name: 'ApiServerPage',
})

const handlers = useHandlers()
const { onVscodeType, sendMessageToVscode } = useVscodeMessage()
const treeData = ref<ApiProject[]>([])
const selectdKeys = ref<string[]>([])
const pattern = ref('')
const search = ref('')
const treeRef = ref<InstanceType<typeof ApiTree> | null>(null)

function handleSearch() {
  pattern.value = search.value
}

function handleDetail(data: Api) {
  sendMessageToVscode({
    type: MType.openDocs,
    data,
  })
}

async function handleRefresh() {
  const data = await handlers.getApiDocs()
  treeData.value = data
}

watchEffect(() => {
  if (!search.value) {
    pattern.value = ''
  }
})

onVscodeType(MType.refreshDocs, () => {
  handleRefresh()
})

onVscodeType<string>(MType.openDocs, (key) => {
  const api = treeRef.value?.getApi(key)
  if (api) {
    search.value = api.path
    handleSearch()
    treeRef.value?.selectApi(key)
    handleDetail(api)
  }
})

onMounted(() => {
  handleRefresh()
})
</script>

<template>
  <div h-full flex flex-col>
    <n-input-group>
      <n-input
        v-model:value="search"
        placeholder="查找API"
        autosize
        clearable
        class="w-3/4"
        @keydown.enter="handleSearch"
      >
        <template #prefix>
          <i i-carbon-flash />
        </template>
      </n-input>
      <n-button class="w-1/4" type="info" @click="handleSearch">
        搜索
      </n-button>
    </n-input-group>
    <div flex-1 overflow-auto>
      <api-tree
        ref="treeRef"
        v-model:selected="selectdKeys"
        :projects="treeData"
        :pattern="pattern"
        @select="handleDetail"
      />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
