<script setup lang="ts">
import type { BenchmarkResult } from '../types'
import { BarChart as EBarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatTime, TEMPLATE_CONFIGS, templateShortName } from '../types'

const props = defineProps<{
  results: BenchmarkResult[]
  templates: string[]
  scales: number[]
}>()

echarts.use([EBarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function buildOption() {
  const series = props.templates.map((template) => {
    const config = TEMPLATE_CONFIGS.find(t => t.key === template)
    return {
      name: templateShortName(template),
      type: 'bar' as const,
      data: props.scales.map((scale) => {
        const r = props.results.find(_r => _r.template === template && _r.scale === scale)
        return r && !r.error ? r.timeMs : null
      }),
      itemStyle: { color: config?.color, borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 60,
      label: {
        show: true,
        position: 'top' as const,
        formatter: (p: any) => (p.value != null ? formatTime(p.value) : ''),
        fontSize: 11,
      },
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
  if (!chartRef.value)
    return
  if ((chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) && retries < 10) {
    requestAnimationFrame(() => renderChart(retries + 1))
    return
  }
  if (chartInstance)
    chartInstance.dispose()
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

watch(() => [props.results, props.templates, props.scales], () => {
  renderChart()
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div ref="chartRef" class="bar-chart" />
</template>

<style scoped>
.bar-chart {
  width: 100%;
  height: 450px;
  margin-top: 16px;
}
</style>
