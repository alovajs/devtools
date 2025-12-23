<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import { useHandlers } from '~/hooks/use-handlers'
import { availableLocales, loadLanguageAsync } from '~/plugins/i18n'
import hljs from '~/utils/hljs'
import { normalizeLocale } from '~/utils/i18n'

const handlers = useHandlers()
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-vscode-theme-kind') {
      hanldeThemeKind(mutation.target as HTMLElement)
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
  if (availableLocales.includes(language)) {
    loadLanguageAsync(language)
  }
}

function hanldeThemeKind(target: HTMLElement) {
  const themeKind = target.getAttribute('data-vscode-theme-kind')
  toggleDark(!themeKind?.includes('light'))
}

const theme = computed(() => isDark.value ? darkTheme : null)

onMounted(async () => {
  // 设置初始化主题
  hanldeThemeKind(document.body)
  // 加载语言
  handleLanguageChange(await handlers.getLanguage())
})

onUnmounted(() => {
  observer.disconnect()
})

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#ccc',
    primaryColorHover: 'var(--vscode-focusBorder)',
    inputColor: 'var(--vscode-input-background)',
  },
  Input: {
    colorFocus: 'var(--vscode-input-background)',
  },
  Tabs: {
    tabColorSegment: 'var(--vscode-editor-background)',
  },
  Message: {
    color: 'var(--vscode-editor-background)',
    colorSuccess: 'var(--vscode-editor-background)',
    colorInfo: 'var(--vscode-editor-background)',
    colorWarning: 'var(--vscode-editor-background)',
    colorError: 'var(--vscode-editor-background)',
  },
}
</script>

<template>
  <n-config-provider :theme :theme-overrides :hljs>
    <n-dialog-provider>
      <n-loading-bar-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-message-provider>
              <slot />
            </n-message-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-loading-bar-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
