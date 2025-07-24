<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { useHandlers } from '~/hooks/use-handlers'
import { availableLocales, loadLanguageAsync } from '~/plugins/i18n'
import hljs from '~/utils/hljs'
import { normalizeLocale } from '~/utils/i18n'

const handlers = useHandlers()
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
function handleLanguageChange(value: string) {
  const language = normalizeLocale(value)
  availableLocales.includes(language) && loadLanguageAsync(language)
}
const theme = computed(() => isDark.value ? darkTheme : null)
onMounted(async () => {
  const language = await handlers.getLanguage()
  handleLanguageChange(language)
})

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
