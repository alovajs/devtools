import type { Ref } from 'vue'
import type { BenchmarkReport, BenchmarkResult, ProgressEvent } from '../types'
import { ref } from 'vue'
import { TEMPLATE_CONFIGS } from '../types'

export function useBenchmark() {
  const loading: Ref<boolean> = ref(false)
  const progress: Ref<number> = ref(0)
  const progressText: Ref<string> = ref('')
  const currentEvents: Ref<ProgressEvent[]> = ref([])
  const results: Ref<BenchmarkResult[]> = ref([])
  const reportTimestamp: Ref<string> = ref('')
  const error: Ref<string | null> = ref(null)
  const hasPreGenerated: Ref<boolean> = ref(false)

  /** 加载预生成结果 */
  async function loadPreGenerated() {
    try {
      const res = await fetch('/api/benchmark/pre-generated')
      if (!res.ok) {
        hasPreGenerated.value = false
        return
      }
      const data: BenchmarkReport = await res.json()
      results.value = data.results
      reportTimestamp.value = data.timestamp
      hasPreGenerated.value = true
    }
    catch {
      hasPreGenerated.value = false
    }
  }

  /** 运行 benchmark */
  async function runBenchmark(scales: number[]) {
    loading.value = true
    progress.value = 0
    error.value = null
    currentEvents.value = []

    try {
      const res = await fetch('/api/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scales }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader)
        throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let currentEventType = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim()
          }
          else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (currentEventType === 'progress') {
              const evt = data as ProgressEvent
              progress.value = evt.progress
              progressText.value = `${evt.template} (${evt.scale})`

              const key = `${evt.template}-${evt.scale}`
              const idx = currentEvents.value.findIndex(
                e => `${e.template}-${e.scale}` === key,
              )
              if (idx >= 0) {
                currentEvents.value = [
                  ...currentEvents.value.slice(0, idx),
                  evt,
                  ...currentEvents.value.slice(idx + 1),
                ]
              }
              else {
                currentEvents.value = [evt, ...currentEvents.value].slice(0, 10)
              }
            }
            else if (currentEventType === 'complete') {
              results.value = data.results
              reportTimestamp.value = data.timestamp
              progress.value = 100
            }
            else if (currentEventType === 'error') {
              throw new Error(data.message)
            }
          }
        }
      }
    }
    catch (e: any) {
      error.value = e.message || String(e)
    }
    finally {
      loading.value = false
    }
  }

  /** 获取某个模板在某个规模的结果 */
  function getTemplateScaleResult(template: string, scale: number): BenchmarkResult | undefined {
    return results.value.find(r => r.template === template && r.scale === scale)
  }

  /** 获取所有唯一的规模列表 */
  function getScales(): number[] {
    return [...new Set(results.value.map(r => r.scale))].sort((a, b) => a - b)
  }

  /** 获取所有唯一的模板列表 */
  function getTemplates(): string[] {
    return TEMPLATE_CONFIGS.map(t => t.key).filter(t => results.value.some(r => r.template === t))
  }

  /** 获取表格数据（模板 x 规模） */
  function getTableData() {
    const templates = getTemplates()
    const scales = getScales()
    return scales.flatMap(scale =>
      templates.map(template => getTemplateScaleResult(template, scale)).filter(Boolean),
    ) as BenchmarkResult[]
  }

  /** 获取柱状图数据 */
  function getBarChartData() {
    const templates = getTemplates()
    const scales = getScales()

    return {
      scales,
      series: templates.map(template => ({
        name: template,
        data: scales.map((scale) => {
          const r = getTemplateScaleResult(template, scale)
          return r && !r.error ? r.timeMs : 0
        }),
      })),
    }
  }

  /** 获取趋势图数据 */
  function getTrendChartData() {
    const templates = getTemplates()
    const scales = getScales()

    return {
      scales,
      series: templates.map(template => ({
        name: template,
        data: scales.map((scale) => {
          const r = getTemplateScaleResult(template, scale)
          return r && !r.error ? r.timeMs : null
        }),
      })),
    }
  }

  return {
    loading,
    progress,
    progressText,
    currentEvents,
    results,
    reportTimestamp,
    error,
    hasPreGenerated,
    loadPreGenerated,
    runBenchmark,
    getTemplateScaleResult,
    getScales,
    getTemplates,
    getTableData,
    getBarChartData,
    getTrendChartData,
  }
}
