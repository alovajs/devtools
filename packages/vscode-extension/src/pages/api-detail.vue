<script setup lang="ts">
import type { Api } from '~/types'
import { MType, useVscodeMessage } from '~/hooks/use-message'

defineOptions({
  name: 'ApiDetialPage',
})

const { onVscodeType, sendAndReceiveToVscode } = useVscodeMessage()

const api = ref<Api | null>(null)

onVscodeType(MType.openApiDetail, (data: Api) => {
  api.value = data
})

onVscodeType(MType.refreshDocs, () => {
  sendAndReceiveToVscode<boolean>({
    type: MType.checkApiExists,
    data: api.value,
  }).then(({ type, data }) => {
    if (type === MType.checkApiExists && !data) {
      api.value = null
    }
  })
})
</script>

<template>
  <n-scrollbar
    class="pos-relative h-full max-h-full overflow-hidden pt-2"
    content-class="px-3"
  >
    <template v-if="!api">
      <n-empty
        class="h-full flex-justify-center"
        :description="$t('api-info.empty')"
      />
    </template>
    <template v-else>
      <ApiInfo :api="api" tabs-class="sticky top-0 z-1 mt-5 backdrop-blur-sm" />
    </template>
  </n-scrollbar>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
