<script setup lang="ts">
import type { AggregatedResult } from '../types'
import { computed } from 'vue'
import { formatBytes, formatMemory, formatTime, TOOL_CONFIGS, toolShortName } from '../types'

const props = defineProps<{
  results: AggregatedResult[]
  tools: string[]
  scales: number[]
}>()

const tableData = computed(() => {
  return props.scales.flatMap(scale =>
    props.tools.map(tool =>
      props.results.find(r => r.tool === tool && r.scale === scale),
    ).filter(Boolean),
  ) as AggregatedResult[]
})

const columns = [
  {
    title: '工具',
    dataIndex: 'tool',
    key: 'tool',
    width: 160,
  },
  {
    title: '规模',
    dataIndex: 'scale',
    key: 'scale',
    width: 80,
    sorter: (a: AggregatedResult, b: AggregatedResult) => a.scale - b.scale,
  },
  {
    title: '耗时(平均)',
    dataIndex: 'avgTimeMs',
    key: 'avgTimeMs',
    width: 130,
    sorter: (a: AggregatedResult, b: AggregatedResult) => a.avgTimeMs - b.avgTimeMs,
  },
  {
    title: '耗时(最快)',
    dataIndex: 'minTimeMs',
    key: 'minTimeMs',
    width: 130,
  },
  {
    title: '耗时(最慢)',
    dataIndex: 'maxTimeMs',
    key: 'maxTimeMs',
    width: 130,
  },
  {
    title: '内存峰值',
    dataIndex: 'memoryMB',
    key: 'memoryMB',
    width: 100,
    sorter: (a: AggregatedResult, b: AggregatedResult) => a.memoryMB - b.memoryMB,
  },
  {
    title: '文件数',
    dataIndex: 'fileCount',
    key: 'fileCount',
    width: 80,
    sorter: (a: AggregatedResult, b: AggregatedResult) => a.fileCount - b.fileCount,
  },
  {
    title: '总大小',
    dataIndex: 'totalSize',
    key: 'totalSize',
    width: 100,
    sorter: (a: AggregatedResult, b: AggregatedResult) => a.totalSize - b.totalSize,
  },
  {
    title: '迭代次数',
    dataIndex: 'iterations',
    key: 'iterations',
    width: 80,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    fixed: 'right' as const,
  },
]

function getToolColor(tool: string): string {
  return TOOL_CONFIGS.find(t => t.key === tool)?.color || '#666'
}
</script>

<template>
  <div class="result-table">
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="false"
      :scroll="{ x: 1100 }"
      size="middle"
      row-key="rowKey"
      :row-class-name="(_record: AggregatedResult) => 'table-row'"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'tool'">
          <div class="tool-cell">
            <span
              class="tool-dot"
              :style="{ background: getToolColor(record.tool) }"
            />
            <span class="tool-name">{{ toolShortName(record.tool) }}</span>
            <span class="tool-version">{{ record.version }}</span>
          </div>
        </template>
        <template v-else-if="column.key === 'scale'">
          <a-tag :color="record.scale >= 1000 ? 'red' : record.scale >= 500 ? 'orange' : 'blue'">
            {{ record.scale }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'avgTimeMs'">
          <span :class="{ fast: record.avgTimeMs < 1000, slow: record.avgTimeMs >= 5000 }">
            {{ formatTime(record.avgTimeMs) }}
          </span>
        </template>
        <template v-else-if="column.key === 'minTimeMs'">
          {{ formatTime(record.minTimeMs) }}
        </template>
        <template v-else-if="column.key === 'maxTimeMs'">
          {{ formatTime(record.maxTimeMs) }}
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

    <!-- 最佳表现 -->
    <div v-if="tableData.length > 0" class="best-summary">
      <a-divider>最佳表现</a-divider>
      <div class="best-cards">
        <div
          v-for="scale in scales"
          :key="scale"
          class="best-card"
        >
          <div class="best-scale">
            {{ scale }} 端点
          </div>
          <template v-for="tool in tools" :key="tool">
            <div
              v-if="results.find(r => r.tool === tool && r.scale === scale && !r.error)"
              class="best-item"
            >
              <span class="best-tool">{{ toolShortName(tool) }}</span>
              <span class="best-value">
                {{ formatTime((results.find(r => r.tool === tool && r.scale === scale) as AggregatedResult).avgTimeMs) }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-table {
  margin-top: 8px;
}

.tool-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tool-name {
  font-weight: 600;
}

.tool-version {
  font-size: 12px;
  color: #999;
}

.fast {
  color: #52c41a;
  font-weight: 600;
}

.slow {
  color: #ff4d4f;
  font-weight: 600;
}

.best-summary {
  margin-top: 24px;
}

.best-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.best-card {
  flex: 1;
  min-width: 200px;
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 16px;
}

.best-scale {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.best-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.best-tool {
  color: #666;
}

.best-value {
  font-weight: 600;
  font-family: monospace;
}
</style>
