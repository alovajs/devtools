<script lang="tsx" setup>
import type { Api } from '~/types'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'ApiInfo',
})

const props = defineProps<{
  api?: Api | null
}>()

const tabValue = ref('params')
const message = useMessage()
const { t } = useI18n()
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
function handleCopy(code: string) {
  const { copy, copied } = useClipboard({ legacy: true })
  copy(code).then(() => {
    if (copied.value) {
      message.success(t('api-info.copy-success'))
    }
    else {
      message.error(t('api-info.copy-fail'))
    }
  })
}
function codeCard({
  name,
  code,
  empty = '暂无数据',
}: {
  name?: string
  code?: string
  empty?: string
}) {
  const { t } = useI18n()
  const defaultEmpty = t('api-info.no-data')
  const showCode = code
    ? (
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
            <div class="i-carbon-copy"></div>
          </n-float-button>
          <n-code word-wrap={true} code={code} language="typescript" class="min-h-8" />
        </div>
      )
    : (
        <n-empty description={empty || defaultEmpty} />
      )
  if (!name) {
    return showCode
  }
  return (
    <div>
      <n-h3 prefix="bar">{name}</n-h3>
      {showCode}
    </div>
  )
}
</script>

<template>
  <div h-full>
    <template v-if="!props?.api">
      <n-empty
        class="h-full flex-justify-center"
        :description="$t('api-info.empty')"
      />
    </template>
    <template v-else>
      <div class="h-full flex flex-col">
        <n-descriptions label-placement="left" :column="1">
          <template #header>
            <n-space>
              <n-tag type="primary">
                {{ props.api.method }}
              </n-tag>
              <span>{{ props.api.path }}</span>
            </n-space>
          </template>
          <n-descriptions-item :label="$t('api-info.method')">
            {{ props.api.pathKey }}
          </n-descriptions-item>
          <n-descriptions-item :label="$t('api-info.description')">
            <span break-all>
              {{ props.api.summary }}
            </span>
          </n-descriptions-item>
        </n-descriptions>
        <n-tabs
          v-model:value="tabValue"
          type="segment"
          class="mt-5 flex flex-1 overflow-auto"
          pane-wrapper-class="flex-1"
          pane-class="h-full overflow-auto"
          animated
          justify-content="space-evenly"
        >
          <n-tab-pane name="'params'" :tab="$t('api-info.params')">
            <n-scrollbar>
              <n-space vertical class="pb-10">
                <code-card
                  :name="$t('api-info.path-params')"
                  :code="typeCode('PathParams', props.api.pathParametersComment)"
                  :empty="$t('api-info.no-path-params')"
                />
                <code-card
                  :name="$t('api-info.query-params')"
                  :code="
                    typeCode('QueryParams', props.api.queryParametersComment)
                  "
                  :empty="$t('api-info.no-query-params')"
                />
                <code-card
                  :name="$t('api-info.request-body')"
                  :code="typeCode('RequestBody', props.api.requestComment)"
                  :empty="$t('api-info.no-request-body')"
                />
              </n-space>
            </n-scrollbar>
          </n-tab-pane>
          <n-tab-pane name="'response'" :tab="$t('api-info.response')">
            <n-scrollbar>
              <code-card
                :code="typeCode('ResponseBody', props.api.responseComment)"
                :empty="$t('api-info.no-response-data')"
              />
            </n-scrollbar>
          </n-tab-pane>
          <n-tab-pane name="'demo'" :tab="$t('api-info.demo')">
            <n-scrollbar>
              <code-card :code="props.api.defaultValue" :empty="$t('api-info.no-demo-code')" />
            </n-scrollbar>
          </n-tab-pane>
        </n-tabs>
      </div>
    </template>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
