<script setup lang="ts">
import { ThunderboltOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, ref } from 'vue'
import BarChart from './components/BarChart.vue'
import ControlPanel from './components/ControlPanel.vue'
import ResultTable from './components/ResultTable.vue'
import TrendChart from './components/TrendChart.vue'
import { useBenchmark } from './composables/useBenchmark'

const {
  loading,
  progress,
  progressText,
  currentEvents,
  results,
  reportTimestamp,
  error: benchError,
  hasPreGenerated,
  loadPreGenerated,
  runBenchmark,
  getTemplates,
  getScales,
} = useBenchmark()

const currentTab = ref('results')

onMounted(async () => {
  await loadPreGenerated()
  if (!hasPreGenerated.value) {
    message.info('未找到预生成结果，请点击"运行 Benchmark"生成对比数据')
  }
})

async function handleRunBenchmark(selectedScales: number[]) {
  currentTab.value = 'results'
  await runBenchmark(selectedScales)
  if (!benchError.value) {
    message.success('Benchmark 完成！')
  }
  else {
    message.error(`Benchmark 失败: ${benchError.value}`)
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <ThunderboltOutlined class="logo-icon" />
        <div>
          <h1 class="title">
            Worma Template Benchmark
          </h1>
          <p class="subtitle">
            alovaGlobals vs axios 模板性能对比
          </p>
        </div>
      </div>
      <div class="header-right">
        <span v-if="reportTimestamp" class="timestamp">
          最后更新: {{ new Date(reportTimestamp).toLocaleString('zh-CN') }}
        </span>
      </div>
    </div>

    <!-- 控制面板 -->
    <ControlPanel
      :loading="loading"
      :progress="progress"
      :progress-text="progressText"
      :current-events="currentEvents"
      :has-results="getScales().length > 0"
      :has-pre-generated="hasPreGenerated"
      @run="handleRunBenchmark"
    />

    <!-- 错误提示 -->
    <a-alert
      v-if="benchError"
      type="error"
      :message="benchError"
      closable
      class="error-alert"
      @close="benchError = null"
    />

    <!-- 主内容区 -->
    <div v-if="getScales().length > 0" class="content-area">
      <a-tabs v-model:active-key="currentTab" class="main-tabs">
        <a-tab-pane key="results" tab="对比表格">
          <ResultTable
            :results="results"
            :templates="getTemplates()"
            :scales="getScales()"
          />
        </a-tab-pane>
        <a-tab-pane key="bar" tab="柱状图">
          <BarChart
            :results="results"
            :templates="getTemplates()"
            :scales="getScales()"
          />
        </a-tab-pane>
        <a-tab-pane key="trend" tab="趋势图">
          <TrendChart
            :results="results"
            :templates="getTemplates()"
            :scales="getScales()"
          />
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-state">
      <a-empty description="暂无 Benchmark 数据">
        <template #image>
          <ThunderboltOutlined :style="{ fontSize: '64px', color: '#d9d9d9' }" />
        </template>
      </a-empty>
    </div>
  </div>
</template>

<style>
/* 全局样式 */
html,
body {
  margin: 0;
  padding: 0;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1677ff 0%, #52c41a 100%);
  border-radius: 12px;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 36px;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.85;
}

.timestamp {
  font-size: 13px;
  opacity: 0.8;
}

.error-alert {
  margin-bottom: 16px;
}

.content-area {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.main-tabs {
  margin-top: -12px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
