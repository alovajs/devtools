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
        right={6}
        top={6}
        position="absolute"
        width="2rem"
        height="2rem"
        onClick={() => handleCopy(code)}
      >
        <i class="i-carbon-copy text-sm" />
      </n-float-button>
      <n-code
        class="min-h-8 p-4"
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
