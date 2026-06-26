<script setup lang="tsx">
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
  return (
    <div class="api-code-wrapper">
      <div class="api-code-toolbar">
        <span class="api-code-lang-label">TypeScript</span>
        <n-button
          text
          size="tiny"
          onClick={() => handleCopy(code)}
        >
          {{
            icon: () => <i class="i-carbon-copy text-xs" />,
          }}
        </n-button>
      </div>
      <n-code
        class="api-code-block"
        word-wrap={true}
        code={code}
        language="typescript"
      />
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
