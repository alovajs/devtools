<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart as ELineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { AggregatedResult } from '../types'
import { toolShortName, TOOL_CONFIGS, formatTime } from '../types'

echarts.use([ELineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  results: AggregatedResult[]
  tools: string[]
  scales: number[]
}>()

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function buildOption() {
  const series = props.tools.map(tool => {
    const config = TOOL_CONFIGS.find(t => t.key === tool)
    return {
      name: toolShortName(tool),
      type: 'line' as const,
      data: props.scales.map(scale => {
        const r = props.results.find(_r => _r.tool === tool && _r.scale === scale)
        return r && !r.error ? (r.avgTimeMs || r.timeMs) : null
      }),
      smooth: true,
      lineStyle: { color: config?.color, width: 3 },
      itemStyle: { color: config?.color },
      symbolSize: 8,
      label: {
        show: true,
        formatter: (p: any) => (p.value != null ? formatTime(p.value) : ''),
        fontSize: 11,
      },
      connectNulls: true,
    }
  })

  return {
    tooltip: {
      trigger: 'axis' as const,
      valueFormatter: (value: any) => (value != null ? formatTime(value) : '-'),
    },
    legend: {
      top: 0,
      textStyle: { fontSize: 13 },
    },
    grid: {
      left: 60,
      right: 40,
      top: 50,
      bottom: 40,
    },
    xAxis: {
      type: 'category' as const,
      data: props.scales.map(s => `${s}`),
      name: '端点数量',
      nameLocation: 'middle' as const,
      nameGap: 28,
    },
    yAxis: {
      type: 'value' as const,
      name: '耗时',
      nameLocation: 'middle' as const,
      nameGap: 45,
      axisLabel: {
        formatter: (v: number) => formatTime(v),
      },
    },
    series,
  }
}

function renderChart(retries = 0) {
  if (!chartRef.value) return
  // tab 切换后容器可能尚未完成布局（display:none 时尺寸为 0），
  // 用 rAF 有限重试，避免死循环
  if ((chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) && retries < 10) {
    requestAnimationFrame(() => renderChart(retries + 1))
    return
  }
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildOption())
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

watch(() => [props.results, props.tools, props.scales], () => {
  renderChart()
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div>
    <div class="trend-info">
      横轴为端点数量，纵轴为生成耗时。曲线越平缓说明扩展性越好。
    </div>
    <div ref="chartRef" class="trend-chart" />
  </div>
</template>

<style scoped>
.trend-info {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
  margin-top: 16px;
}

.trend-chart {
  width: 100%;
  height: 450px;
}
</style>
