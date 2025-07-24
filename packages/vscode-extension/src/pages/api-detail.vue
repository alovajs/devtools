<script setup lang="ts">
import type { Api } from '~/types'
import { MType, useVscodeMessage } from '~/hooks/use-message'

defineOptions({
  name: 'ApiDetialPage',
})

const { onVscodeType } = useVscodeMessage()

const api = ref<Api | null>(null)

onVscodeType(MType.openApiDetail, (data: Api) => {
  api.value = data
})
</script>

<template>
  <ApiInfo :api="api" />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
