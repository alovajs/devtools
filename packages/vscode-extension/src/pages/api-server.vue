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
  <n-scrollbar class="pos-relative h-full overflow-hidden">
    <div class="search-bar sticky top-0 z-1 pt-2">
      <n-input
        v-model:value="search"
        :placeholder="t('api-server.search-placeholder')"
        size="small"
        clearable
        class="api-search-input"
      >
        <template #prefix>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-xs opacity-50">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </template>
      </n-input>
    </div>
    <div class="px-3">
      <api-tree
        ref="treeRef"
        v-model:selected="selectdKeys"
        :loading
        :pattern
        :projects="treeData"
        @select="handleDetail"
      />
    </div>
  </n-scrollbar>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
