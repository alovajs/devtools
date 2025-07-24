<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import hljs from '~/utils/hljs'

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-vscode-theme-kind') {
      const target = mutation.target as HTMLHtmlElement
      const themeKind = target.getAttribute('data-vscode-theme-kind')
      toggleDark(!themeKind?.includes('light'))
    }
  })
})

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-vscode-theme-kind'],
  attributeOldValue: true,
  subtree: true,
})

const theme = computed(() => isDark.value ? darkTheme : null)

onUnmounted(() => {
  observer.disconnect()
})
</script>

<template>
  <n-config-provider :theme="theme" :hljs="hljs">
    <n-message-provider>
      <slot />
    </n-message-provider>
  </n-config-provider>
</template>
