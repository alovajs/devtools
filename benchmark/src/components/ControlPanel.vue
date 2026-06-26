<script setup lang="ts">
import type { ProgressEvent } from '../types'
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { SCALE_OPTIONS } from '../types'

defineProps<{
  loading: boolean
  progress: number
  progressText: string
  currentEvents: ProgressEvent[]
  hasResults: boolean
  hasPreGenerated: boolean
}>()

const emit = defineEmits<{
  run: [scales: number[], iterations: number]
}>()

const selectedScales = ref<number[]>([200, 500, 1000, 5000])
const iterations = ref(3)

const allScalesSelected = computed(() => selectedScales.value.length === SCALE_OPTIONS.length)

function toggleAllScales() {
  if (allScalesSelected.value) {
    selectedScales.value = []
  }
  else {
    selectedScales.value = [...SCALE_OPTIONS]
  }
}

function onRun() {
  if (selectedScales.value.length === 0)
    return
  emit('run', selectedScales.value, iterations.value)
}
</script>

<template>
  <div class="control-panel">
    <div class="control-row">
      <!-- 规模选择 -->
      <div class="scale-selector">
        <span class="label">测试规模:</span>
        <a-checkbox-group v-model:value="selectedScales" :disabled="loading">
          <a-checkbox v-for="s in SCALE_OPTIONS" :key="s" :value="s">
            {{ s }}
          </a-checkbox>
        </a-checkbox-group>
        <a-button size="small" type="link" :disabled="loading" @click="toggleAllScales">
          {{ allScalesSelected ? '取消全选' : '全选' }}
        </a-button>
      </div>

      <!-- 迭代次数 -->
      <div class="iterations-selector">
        <span class="label">迭代次数:</span>
        <a-input-number
          v-model:value="iterations"
          :min="1"
          :max="10"
          :disabled="loading"
          size="small"
          style="width: 80px"
        />
      </div>

      <!-- 操作按钮 -->
      <a-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="selectedScales.length === 0"
        class="run-btn"
        @click="onRun"
      >
        <template #icon>
          <CaretRightOutlined />
        </template>
        {{ loading ? '运行中...' : '运行 Benchmark' }}
      </a-button>
    </div>

    <!-- 进度条 -->
    <div v-if="loading" class="progress-area">
      <a-progress
        :percent="progress"
        :status="progress === 100 ? 'success' : 'active'"
        :stroke-color="{ '0%': '#1677ff', '100%': '#52c41a' }"
      />
      <div class="progress-text">
        {{ progressText }}
      </div>

      <!-- 实时事件 -->
      <div class="events-list">
        <div
          v-for="evt in currentEvents"
          :key="`${evt.tool}-${evt.scale}-${evt.iteration}`"
          class="event-item"
          :class="{ 'event-done': evt.status === 'done', 'event-error': evt.status === 'error' }"
        >
          <LoadingOutlined v-if="evt.status === 'running'" spin class="event-icon" />
          <CheckCircleOutlined v-else-if="evt.status === 'done'" class="event-icon event-success" />
          <CloseCircleOutlined v-else-if="evt.status === 'error'" class="event-icon event-error-icon" />
          <span class="event-tool">{{ evt.tool }}</span>
          <span class="event-scale">({{ evt.scale }})</span>
          <span class="event-iter">#{{ evt.iteration }}/{{ evt.totalIterations }}</span>
          <template v-if="evt.result">
            <span class="event-time">{{ evt.result.timeMs }}ms</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 预生成提示 -->
    <div v-if="hasPreGenerated && !loading && !hasResults" class="pre-gen-notice">
      <a-alert type="info" show-icon>
        <template #message>
          已加载预生成结果。你也可以点击「运行 Benchmark」重新测试。
        </template>
      </a-alert>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  background: white;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.control-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.scale-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.iterations-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  font-size: 14px;
}

.run-btn {
  margin-left: auto;
  min-width: 180px;
}

.progress-area {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.events-list {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
}

.event-done {
  background: #f6ffed;
}

.event-error {
  background: #fff2f0;
}

.event-icon {
  font-size: 14px;
  color: #1677ff;
}

.event-success {
  color: #52c41a;
}

.event-error-icon {
  color: #ff4d4f;
}

.event-tool {
  font-weight: 600;
  color: #333;
}

.event-scale {
  color: #888;
}

.event-iter {
  color: #aaa;
}

.event-time {
  margin-left: auto;
  color: #1677ff;
  font-weight: 600;
}

.pre-gen-notice {
  margin-top: 12px;
}
</style>
