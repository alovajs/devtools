<script lang="tsx" setup>
import type { Api, MethodType } from '~/types'

defineOptions({
  name: 'ApiInfo',
})

const props = defineProps<{
  api: Api
  tabsClass?: string
}>()

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

// Whether each section has data to display
const hasPathParams = computed(() => !!typeCode('PathParams', props.api.pathParametersComment))
const hasQueryParams = computed(() => !!typeCode('QueryParams', props.api.queryParametersComment))
const hasRequestBody = computed(() => !!typeCode('RequestBody', props.api.requestBodyComment))
const hasResponseBody = computed(() => !!typeCode('ResponseBody', props.api.responseComment))
const hasDemoCode = computed(() => !!props.api.callingCode)
const hasAnyParam = computed(() => hasPathParams.value || hasQueryParams.value || hasRequestBody.value)

// Default to first available tab
function resolveInitialTab(): string {
  if (hasAnyParam.value)
    return 'params'
  if (hasResponseBody.value)
    return 'response'
  if (hasDemoCode.value)
    return 'demo'
  return 'params'
}
const tabValue = ref(resolveInitialTab())
</script>

<template>
  <div>
    <!-- Card-style header -->
    <div class="api-header-card">
      <div class="flex items-center gap-2">
        <ApiMethod :method="api.method as MethodType" />
        <span class="api-path">{{ api.path }}</span>
      </div>
      <div class="api-meta">
        <div class="api-name">
          {{ api.name }}
        </div>
        <div v-if="api.summary" class="api-summary">
          {{ api.summary }}
        </div>
      </div>
    </div>

    <n-tabs
      v-model:value="tabValue"
      type="segment"
      :class="tabsClass"
      animated
      justify-content="space-evenly"
    >
      <n-tab name="params" :disabled="!hasAnyParam">
        <template #default>
          <span class="flex items-center gap-1.5 fw-500">
            <i class="i-carbon-list text-base" />
            {{ $t('api-info.params') }}
          </span>
        </template>
      </n-tab>
      <n-tab name="response" :disabled="!hasResponseBody">
        <template #default>
          <span class="flex items-center gap-1.5 fw-500">
            <i class="i-carbon-result text-base" />
            {{ $t('api-info.response') }}
          </span>
        </template>
      </n-tab>
      <n-tab name="demo" :disabled="!hasDemoCode">
        <template #default>
          <span class="flex items-center gap-1.5 fw-500">
            <i class="i-carbon-terminal text-base" />
            {{ $t('api-info.demo') }}
          </span>
        </template>
      </n-tab>
    </n-tabs>
    <DynamicSlots :show="tabValue" class="api-tab-content">
      <template v-if="hasAnyParam" #params>
        <n-collapse :default-expanded-names="['PathParams']">
          <n-collapse-item v-if="hasPathParams" name="PathParams">
            <template #header>
              <span class="text-sm font-500">
                {{ $t('api-info.path-params') }}
              </span>
            </template>
            <ApiCodeCard
              :code="typeCode('PathParams', api.pathParametersComment)"
              :empty="$t('api-info.no-path-params')"
            />
          </n-collapse-item>
          <n-collapse-item v-if="hasQueryParams" name="QueryParams">
            <template #header>
              <span class="text-sm font-500">
                {{ $t('api-info.query-params') }}
              </span>
            </template>
            <ApiCodeCard
              :code="typeCode('QueryParams', api.queryParametersComment)"
              :empty="$t('api-info.no-query-params')"
            />
          </n-collapse-item>
          <n-collapse-item v-if="hasRequestBody" name="RequestBody">
            <template #header>
              <span class="text-sm font-500">
                {{ $t('api-info.request-body') }}
              </span>
            </template>
            <ApiCodeCard
              :code="typeCode('RequestBody', api.requestBodyComment)"
              :empty="$t('api-info.no-request-body')"
            />
          </n-collapse-item>
        </n-collapse>
      </template>
      <template v-if="hasResponseBody" #response>
        <ApiCodeCard
          :code="typeCode('ResponseBody', api.responseComment)"
          :empty="$t('api-info.no-response-data')"
        />
      </template>
      <template v-if="hasDemoCode" #demo>
        <ApiCodeCard
          :code="api.callingCode"
          :empty="$t('api-info.no-demo-code')"
        />
      </template>
    </DynamicSlots>
  </div>
</template>
