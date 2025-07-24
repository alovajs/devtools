<script lang="tsx" setup>
import type { Api } from '~/types'

defineOptions({
  name: 'ApiInfo',
})

const props = defineProps<{
  api?: Api | null
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
function codeCard({
  name,
  code,
  empty = '暂无数据',
}: {
  name?: string
  code?: string
  empty?: string
}) {
  const showCode = code
    ? (
        <n-code word-wrap={true} code={code} language="typescript" />
      )
    : (
        <n-empty description={empty} />
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
        description="你什么也找不到"
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
          <n-descriptions-item label="方法">
            {{ props.api.pathKey }}
          </n-descriptions-item>
          <n-descriptions-item label="描述">
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
          <n-tab-pane name="params" tab="参数">
            <n-scrollbar>
              <n-space vertical class="pb-10">
                <code-card
                  name="Path 参数"
                  :code="typeCode('PathParams', props.api.pathParametersComment)"
                  empty="无路径参数"
                />
                <code-card
                  name="Query 参数"
                  :code="
                    typeCode('QueryParams', props.api.queryParametersComment)
                  "
                  empty="无查询参数"
                />
                <code-card
                  name="请求体"
                  :code="typeCode('RequestBody', props.api.requestComment)"
                  empty="无请求体"
                />
              </n-space>
            </n-scrollbar>
          </n-tab-pane>
          <n-tab-pane name="response" tab="响应">
            <n-scrollbar>
              <code-card
                :code="typeCode('ResponseBody', props.api.responseComment)"
                empty="无响应数据"
              />
            </n-scrollbar>
          </n-tab-pane>
          <n-tab-pane name="demo" tab="示例">
            <n-scrollbar>
              <code-card :code="props.api.defaultValue" empty="无示例代码" />
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
