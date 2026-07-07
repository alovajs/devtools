<script setup lang="tsx">
import { NIcon } from 'naive-ui'
import hljs from '~/utils/hljs'
import { handleCopy } from '~/utils/web'

defineOptions({
  name: 'ApiCodeCard',
})

defineProps<{
  code?: MaybeNull<string>
  name?: MaybeNull<string>
  empty?: MaybeNull<string>
}>()

const { t } = useI18n()

function ShowCode({ code, empty }: {
  code?: MaybeNull<string>
  empty?: MaybeNull<string>
}) {
  if (!code) {
    return <n-empty description={empty || t('api-info.no-data')} />
  }
  const highlighted = hljs.highlight(code, { language: 'typescript' }).value
  return (
    <div class="api-code-wrapper">
      <div class="api-code-toolbar">
        <span class="api-code-lang-label">TypeScript</span>
        <n-button
          text
          size="tiny"
          onClick={() => handleCopy(code)}
        >
          <NIcon>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </NIcon>
        </n-button>
      </div>
      <pre class="api-code-block hljs">
        <code v-html={highlighted} />
      </pre>
    </div>
  )
}
</script>

<template>
  <template v-if="name">
    <div>
      <n-h4 prefix="bar">
        {{ name }}
      </n-h4>
      <ShowCode :code :empty />
    </div>
  </template>
  <template v-else>
    <ShowCode :code :empty />
  </template>
</template>
