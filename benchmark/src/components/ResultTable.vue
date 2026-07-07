<script setup lang="ts">
import type { BenchmarkResult } from '../types'
import { computed } from 'vue'
import { formatBytes, formatMemory, formatTime, TEMPLATE_CONFIGS, templateShortName } from '../types'

const props = defineProps<{
  results: BenchmarkResult[]
  templates: string[]
  scales: number[]
}>()

const tableData = computed(() => {
  return props.scales.flatMap(scale =>
    props.templates.map(template =>
      props.results.find(r => r.template === template && r.scale === scale),
    ).filter(Boolean),
  ) as BenchmarkResult[]
})

const columns = [
  {
    title: '模板',
    dataIndex: 'template',
    key: 'template',
    width: 160,
  },
  {
    title: '规模',
    dataIndex: 'scale',
    key: 'scale',
    width: 80,
    sorter: (a: BenchmarkResult, b: BenchmarkResult) => a.scale - b.scale,
  },
  {
    title: '耗时',
    dataIndex: 'timeMs',
    key: 'timeMs',
    width: 130,
    sorter: (a: BenchmarkResult, b: BenchmarkResult) => a.timeMs - b.timeMs,
  },
  {
    title: '内存峰值',
    dataIndex: 'memoryMB',
    key: 'memoryMB',
    width: 100,
    sorter: (a: BenchmarkResult, b: BenchmarkResult) => a.memoryMB - b.memoryMB,
  },
  {
    title: '文件数',
    dataIndex: 'fileCount',
    key: 'fileCount',
    width: 80,
    sorter: (a: BenchmarkResult, b: BenchmarkResult) => a.fileCount - b.fileCount,
  },
  {
    title: '总大小',
    dataIndex: 'totalSize',
    key: 'totalSize',
    width: 100,
    sorter: (a: BenchmarkResult, b: BenchmarkResult) => a.totalSize - b.totalSize,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    fixed: 'right' as const,
  },
]

function getTemplateColor(template: string): string {
  return TEMPLATE_CONFIGS.find(t => t.key === template)?.color || '#666'
}
</script>

<template>
  <div class="result-table">
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="false"
      :scroll="{ x: 800 }"
      size="middle"
      row-key="rowKey"
      :row-class-name="(_record: BenchmarkResult) => 'table-row'"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'template'">
          <div class="template-cell">
            <span
              class="template-dot"
              :style="{ background: getTemplateColor(record.template) }"
            />
            <span class="template-name">{{ templateShortName(record.template) }}</span>
            <span class="template-version">{{ record.version }}</span>
          </div>
        </template>
        <template v-else-if="column.key === 'scale'">
          <a-tag>
            {{ record.scale }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'timeMs'">
          <span>
            {{ formatTime(record.timeMs) }}
          </span>
        </template>
        <template v-else-if="column.key === 'memoryMB'">
          {{ formatMemory(record.memoryMB) }}
        </template>
        <template v-else-if="column.key === 'fileCount'">
          {{ record.fileCount >= 0 ? record.fileCount : '-' }}
        </template>
        <template v-else-if="column.key === 'totalSize'">
          {{ formatBytes(record.totalSize) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag v-if="record.error" color="error">
            失败
          </a-tag>
          <a-tag v-else color="success">
            成功
          </a-tag>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.result-table {
  margin-top: 8px;
}

.template-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.template-name {
  font-weight: 600;
}

.template-version {
  font-size: 12px;
  color: #999;
}
</style>
