import type { Ref } from 'vue'
import type { AggregatedResult, BenchmarkReport, ProgressEvent } from '../types'
import { ref } from 'vue'
import { TOOL_CONFIGS } from '../types'

export function useBenchmark() {
  const loading: Ref<boolean> = ref(false)
  const progress: Ref<number> = ref(0)
  const progressText: Ref<string> = ref('')
  const currentEvents: Ref<ProgressEvent[]> = ref([])
  const results: Ref<AggregatedResult[]> = ref([])
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

  /** 加载历史记录列表 */
  async function loadHistory(): Promise<string[]> {
    try {
      const res = await fetch('/api/benchmark/history')
      return await res.json()
    }
    catch {
      return []
    }
  }

  /** 加载特定历史记录 */
  async function loadHistoryDetail(id: string): Promise<BenchmarkReport | null> {
    try {
      const res = await fetch(`/api/benchmark/history-detail?id=${encodeURIComponent(id)}`)
      if (!res.ok)
        return null
      return await res.json()
    }
    catch {
      return null
    }
  }

  /** 运行 benchmark */
  async function runBenchmark(scales: number[], iterations: number = 1) {
    loading.value = true
    progress.value = 0
    error.value = null
    currentEvents.value = []

    try {
      const res = await fetch('/api/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scales, iterations }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader)
        throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      // currentEventType 必须跨 read chunk 持久化，否则当 SSE 的
      // `event:` 行与 `data:` 行分属不同 chunk 时事件类型会丢失
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
              progressText.value = `${evt.tool} (${evt.scale})`

              // 用 (tool, scale, iteration) 去重：running 添加，done/error 替换
              const key = `${evt.tool}-${evt.scale}-${evt.iteration}`
              const idx = currentEvents.value.findIndex(
                e => `${e.tool}-${e.scale}-${e.iteration}` === key,
              )
              if (idx >= 0) {
                // 替换已有条目（running → done/error）
                currentEvents.value = [
                  ...currentEvents.value.slice(0, idx),
                  evt,
                  ...currentEvents.value.slice(idx + 1),
                ]
              }
              else {
                // 新任务，添加到头部
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

  /** 获取某个工具在某个规模的结果 */
  function getToolScaleResult(tool: string, scale: number): AggregatedResult | undefined {
    return results.value.find(r => r.tool === tool && r.scale === scale)
  }

  /** 获取所有唯一的规模列表 */
  function getScales(): number[] {
    return [...new Set(results.value.map(r => r.scale))].sort((a, b) => a - b)
  }

  /** 获取所有唯一的工具列表 */
  function getTools(): string[] {
    return TOOL_CONFIGS.map(t => t.key).filter(t => results.value.some(r => r.tool === t))
  }

  /** 获取表格数据（工具 x 规模） */
  function getTableData() {
    const tools = getTools()
    const scales = getScales()
    return scales.flatMap(scale =>
      tools.map(tool => getToolScaleResult(tool, scale)).filter(Boolean),
    ) as AggregatedResult[]
  }

  /** 获取柱状图数据 */
  function getBarChartData() {
    const tools = getTools()
    const scales = getScales()

    return {
      scales,
      series: tools.map(tool => ({
        name: tool,
        data: scales.map((scale) => {
          const r = getToolScaleResult(tool, scale)
          return r && !r.error ? r.avgTimeMs || r.timeMs : 0
        }),
      })),
    }
  }

  /** 获取趋势图数据 */
  function getTrendChartData() {
    const tools = getTools()
    const scales = getScales()

    return {
      scales,
      series: tools.map(tool => ({
        name: tool,
        data: scales.map((scale) => {
          const r = getToolScaleResult(tool, scale)
          return r && !r.error ? r.avgTimeMs || r.timeMs : null
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
    loadHistory,
    loadHistoryDetail,
    runBenchmark,
    getToolScaleResult,
    getScales,
    getTools,
    getTableData,
    getBarChartData,
    getTrendChartData,
  }
}
