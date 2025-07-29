<script lang="tsx" setup>
import type { Api, MethodType } from '~/types'

defineOptions({
  name: 'ApiInfo',
})

defineProps<{
  api: Api
  tabsClass?: string
}>()

const tabValue = ref('params')
function typeCode(name: string, comment?: string) {
  if (!comment) {
    return ''
  }
  const pureComment = comment
    .replace(/\n\*/g, '\n')
    .replace(/^\* /gm, '')
    .replace(/Array<(.+)>/g, 'Array< \$1 >')
    .trim()
  if (!pureComment) {
    return ''
  }
  return `type ${name ?? 'tsType'} = ${pureComment}`
}
</script>

<template>
  <div>
    <n-descriptions label-placement="left" :column="1">
      <template #header>
        <n-space>
          <ApiMethod :method="api.method as MethodType" />
          <span>{{ api.path }}</span>
        </n-space>
      </template>
      <n-descriptions-item :label="$t('api-info.method')">
        {{ api.pathKey }}
      </n-descriptions-item>
      <n-descriptions-item :label="$t('api-info.description')">
        <span break-all>
          {{ api.summary }}
        </span>
      </n-descriptions-item>
    </n-descriptions>
    <n-tabs
      v-model:value="tabValue"
      type="segment"
      :class="tabsClass"
      animated
      justify-content="space-evenly"
    >
      <n-tab name="params">
        {{ $t('api-info.params') }}
      </n-tab>
      <n-tab name="response">
        {{ $t('api-info.response') }}
      </n-tab>
      <n-tab name="demo">
        {{ $t('api-info.demo') }}
      </n-tab>
    </n-tabs>
    <DynamicSlots :show="tabValue" class="mt-4">
      <template #params>
        <n-space vertical>
          <ApiCodeCard
            :name="$t('api-info.path-params')"
            :code="typeCode('PathParams', api.pathParametersComment)"
            :empty="$t('api-info.no-path-params')"
          />
          <ApiCodeCard
            :name="$t('api-info.query-params')"
            :code="
              typeCode('QueryParams', api.queryParametersComment)
            "
            :empty="$t('api-info.no-query-params')"
          />
          <ApiCodeCard
            :name="$t('api-info.request-body')"
            :code="typeCode('RequestBody', api.requestComment)"
            :empty="$t('api-info.no-request-body')"
          />
        </n-space>
      </template>
      <template #response>
        <ApiCodeCard
          :code="typeCode('ResponseBody', api.responseComment)"
          :empty="$t('api-info.no-response-data')"
        />
      </template>
      <template #demo>
        <ApiCodeCard
          :code="api.defaultValue"
          :empty="$t('api-info.no-demo-code')"
        />
      </template>
    </DynamicSlots>
  </div>
</template>
