<script setup lang="ts">
import type { ApiProject } from '@/types'
import { useHandlers } from '@/hooks/use-handlers'

defineOptions({
  name: 'SidebarPage',
})
const handlers = useHandlers()
const treeData = ref<ApiProject[]>([])
onMounted(async () => {
  const data = await handlers.getApiDocs()
  treeData.value = data
})
</script>

<template>
  <div app-container>
    <n-input-group>
      <n-input placeholder="查找API" autosize class="w-3/4">
        <template #prefix>
          <i i-carbon-flash />
        </template>
      </n-input>
      <n-button class="w-1/4" type="info">
        搜索
      </n-button>
    </n-input-group>
    <n-card hoverable>
      <api-tree :projects="treeData" />
    </n-card>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
