<script setup lang="ts">
import type { TagProps } from 'naive-ui'
import type { MethodType } from '~/types'

defineProps<{
  method: MethodType
  html?: string
}>()
const TagMap: Record<MethodType, TagProps['type']> = {
  GET: 'success',
  POST: 'warning',
  PUT: 'primary',
  DELETE: 'error',
  PATCH: 'default',
  TRACE: 'info',
}
</script>

<template>
  <n-tag size="small" :type="TagMap[method]">
    <span v-html="html ?? method" />
  </n-tag>
</template>
