<script setup lang="ts">
import type { BenchmarkResult } from '../types'
import { LineChart as ELineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatMemory, formatTime, TEMPLATE_CONFIGS, templateShortName } from '../types'

const props = defineProps<{
  results: BenchmarkResult[]
  templates: string[]
  scales: number[]
}>()

echarts.use([ELineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const timeChartRef = ref<HTMLDivElement>()
const memChartRef = ref<HTMLDivElement>()
let timeChart: echarts.ECharts | null = null
let memChart: echarts.ECharts | null = null

function buildTimeOption() {
  const series = props.templates.map((template) => {
    const config = TEMPLATE_CONFIGS.find(t => t.key === template)
    return {
      name: templateShortName(template),
      type: 'line' as const,
      data: props.scales.map((scale) => {
        const r = props.results.find(_r => _r.template === template && _r.scale === scale)
        return r && !r.error ? r.timeMs : null
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
      bottom: 30,
    },
    xAxis: {
      type: 'category' as const,
      data: props.scales.map(s => `${s}`),
      name: '端点数量',
      nameLocation: 'middle' as const,
      nameGap: 25,
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

function buildMemOption() {
  const series = props.templates.map((template) => {
    const config = TEMPLATE_CONFIGS.find(t => t.key === template)
    return {
      name: templateShortName(template),
      type: 'line' as const,
      data: props.scales.map((scale) => {
        const r = props.results.find(_r => _r.template === template && _r.scale === scale)
        return r && !r.error && r.memoryMB > 0 ? r.memoryMB : null
      }),
      smooth: true,
      lineStyle: { color: config?.color, width: 3, type: 'dashed' as const },
      itemStyle: { color: config?.color },
      symbolSize: 8,
      symbol: 'diamond',
      label: {
        show: true,
        formatter: (p: any) => (p.value != null ? formatMemory(p.value) : ''),
        fontSize: 11,
      },
      connectNulls: true,
    }
  })

  return {
    tooltip: {
      trigger: 'axis' as const,
      valueFormatter: (value: any) => (value != null ? formatMemory(value) : '-'),
    },
    legend: {
      top: 0,
      textStyle: { fontSize: 13 },
    },
    grid: {
      left: 60,
      right: 40,
      top: 50,
      bottom: 30,
    },
    xAxis: {
      type: 'category' as const,
      data: props.scales.map(s => `${s}`),
      name: '端点数量',
      nameLocation: 'middle' as const,
      nameGap: 25,
    },
    yAxis: {
      type: 'value' as const,
      name: '内存 (MB)',
      nameLocation: 'middle' as const,
      nameGap: 50,
      axisLabel: {
        formatter: (v: number) => formatMemory(v),
      },
    },
    series,
  }
}

function renderChart(chartRef: HTMLDivElement, buildOption: () => any, retries = 0): echarts.ECharts | null {
  if (!chartRef)
    return null
  if ((chartRef.clientWidth === 0 || chartRef.clientHeight === 0) && retries < 10) {
    requestAnimationFrame(() => renderChart(chartRef, buildOption, retries + 1))
    return null
  }
  const instance = echarts.init(chartRef)
  instance.setOption(buildOption())
  return instance
}

function renderAll() {
  if (timeChartRef.value) {
    if (timeChart) timeChart.dispose()
    timeChart = renderChart(timeChartRef.value, buildTimeOption)
  }
  if (memChartRef.value) {
    if (memChart) memChart.dispose()
    memChart = renderChart(memChartRef.value, buildMemOption)
  }
}

function handleResize() {
  timeChart?.resize()
  memChart?.resize()
}

onMounted(() => {
  renderAll()
  window.addEventListener('resize', handleResize)
})

watch(() => [props.results, props.templates, props.scales], () => {
  renderAll()
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  timeChart?.dispose()
  memChart?.dispose()
})
</script>

<template>
  <div>
    <div class="trend-info">
      横轴为端点数量，纵轴为生成耗时。曲线越平缓说明扩展性越好。
    </div>
    <div ref="timeChartRef" class="trend-chart" />
    <a-divider />
    <div class="trend-info">
      横轴为端点数量，纵轴为内存峰值。对比两个模板的内存占用趋势。
    </div>
    <div ref="memChartRef" class="trend-chart" />
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
  height: 400px;
}
</style>
