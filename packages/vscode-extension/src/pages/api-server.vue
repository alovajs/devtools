<script setup lang="ts">
import type ApiTree from '~/components/ApiTree.vue'
import type { Api, ApiProject } from '~/types'
import { MType, useHandlers } from '~/hooks/use-handlers'
import { useVscodeMessage } from '~/hooks/use-message'

defineOptions({
  name: 'ApiServerPage',
})

const { t } = useI18n()
const handlers = useHandlers()
const { onVscodeType, sendMessageToVscode } = useVscodeMessage()
const treeData = ref<ApiProject[]>([])
const selectdKeys = ref<string[]>([])
const pattern = ref('')
const search = ref('')
const treeRef = ref<InstanceType<typeof ApiTree> | null>(null)
const handleSearch = useDebounceFn((value: string) => {
  pattern.value = value
}, 300)

function handleDetail(data: Api) {
  sendMessageToVscode({
    type: MType.openDocs,
    data,
  })
}

const loading = ref(false)
async function handleRefresh() {
  loading.value = true
  try {
    const data = await handlers.getApiDocs()
    treeData.value = data
  }
  finally {
    loading.value = false
  }
}
watch(search, handleSearch)

onVscodeType(MType.refreshDocs, () => {
  handleRefresh()
})

onVscodeType<string>(MType.openDocs, (key) => {
  const api = treeRef.value?.getApi(key)
  if (api) {
    search.value = `${api.method}${api.path}`
    treeRef.value?.selectApi(key)
    handleDetail(api)
  }
})

onMounted(() => {
  handleRefresh()
})
</script>

<template>
  <n-scrollbar class="pos-relative h-full overflow-hidden pt-2" content-class="px-3">
    <div class="search-bar sticky top-0 z-1">
      <n-input
        v-model:value="search"
        :placeholder="t('api-server.search-placeholder')"
        size="small"
        clearable
        round
      >
        <template #prefix>
          <i class="i-carbon-search text-xs opacity-50" />
        </template>
      </n-input>
    </div>
    <api-tree
      ref="treeRef"
      v-model:selected="selectdKeys"
      :loading
      :pattern
      :projects="treeData"
      @select="handleDetail"
    />
  </n-scrollbar>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
