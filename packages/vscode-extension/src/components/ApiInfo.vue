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
    <!-- Breadcrumb: tag > api.name -->
    <div v-if="api.tag" class="api-breadcrumb">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="api-breadcrumb-icon">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      <span>{{ api.tag }}</span>
      <i class="api-breadcrumb-sep">&gt;</i>
      <span class="api-breadcrumb-current">{{ api.name }}</span>
    </div>

    <!-- Flat header (no card) -->
    <div class="api-header-flat">
      <div class="api-header-top">
        <ApiMethod :method="api.method as MethodType" />
        <span class="api-header-title">{{ api.path }}</span>
      </div>
      <div v-if="api.summary" class="api-header-desc">
        {{ api.summary }}
      </div>
    </div>

    <n-tabs
      v-model:value="tabValue"
      class="api-tabs-modern"
      :class="tabsClass"
      animated
    >
      <n-tab name="params" :disabled="!hasAnyParam">
        <template #default>
          <span class="flex items-center gap-1.5 fw-500">
            {{ $t('api-info.params') }}
          </span>
        </template>
      </n-tab>
      <n-tab name="response" :disabled="!hasResponseBody">
        <template #default>
          <span class="flex items-center gap-1.5 fw-500">
            {{ $t('api-info.response') }}
          </span>
        </template>
      </n-tab>
      <n-tab name="demo" :disabled="!hasDemoCode">
        <template #default>
          <span class="flex items-center gap-1.5 fw-500">
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
