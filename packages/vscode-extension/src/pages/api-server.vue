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

async function handleRefresh() {
  const data = await handlers.getApiDocs()
  treeData.value = data
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
  <div class="server-container" pos-relative h-full overflow-hidden pt-2>
    <n-scrollbar style="max-height: 100%" content-class="px-3">
      <n-input
        v-model:value="search"
        :placeholder="t('api-server.search-placeholder')"
        autosize
        clearable
        class="sticky top-0 z-1 mt-1 w-full backdrop-blur-sm"
      >
        <template #prefix>
          <i i-carbon-flash />
        </template>
      </n-input>
      <api-tree
        ref="treeRef"
        v-model:selected="selectdKeys"
        :projects="treeData"
        :pattern="pattern"
        @select="handleDetail"
      />
    </n-scrollbar>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
