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
  <ApiInfo :api="api" />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
