<script setup lang="ts">
import type { MethodType } from '~/types'

defineProps<{
  method: MethodType
  html?: string
}>()
</script>

<template>
  <span class="api-method-badge" :class="method">
    <span v-html="html ?? method" />
  </span>
</template>
