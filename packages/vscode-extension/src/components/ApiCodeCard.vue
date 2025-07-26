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
    <div class="pos-relative">
      <n-float-button
        shape="square"
        right={0}
        width="2rem"
        height="2rem"
        position="absolute"
        class="p-0"
        onClick={() => handleCopy(code)}
      >
        <i class="i-carbon-copy" />
      </n-float-button>
      <n-code
        class="min-h-8"
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
      <n-h3 prefix="bar">
        {{ name }}
      </n-h3>
      <ShowCode :code="code" :empty="empty" />
    </div>
  </template>
  <template v-else>
    <ShowCode :code="code" :empty="empty" />
  </template>
</template>
