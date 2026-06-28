/** 单次 benchmark 结果 */
export interface BenchmarkResult {
  template: string
  scale: number
  timeMs: number
  memoryMB: number
  fileCount: number
  totalSize: number
  files: string[]
  version: string
  error: string | null
}

/** 完整的 benchmark 报告 */
export interface BenchmarkReport {
  results: BenchmarkResult[]
  timestamp: string
}

/** SSE 进度事件 */
export interface ProgressEvent {
  template: string
  scale: number
  progress: number
  status: 'running' | 'done' | 'error'
  result?: BenchmarkResult
}

/** 模板显示配置 */
export interface TemplateDisplay {
  key: string
  label: string
  color: string
  description: string
}

export const TEMPLATE_CONFIGS: TemplateDisplay[] = [
  { key: 'alovaGlobals', label: 'alovaGlobals', color: '#1677ff', description: '全局式 API 模板' },
  { key: 'axios', label: 'axios', color: '#52c41a', description: 'Axios 模板' },
]

export const SCALE_OPTIONS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]

/** 格式化字节 */
export function formatBytes(bytes: number): string {
  if (bytes < 0)
    return '-'
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** 格式化时间 */
export function formatTime(ms: number): string {
  if (ms < 0)
    return '-'
  if (ms < 1000)
    return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** 格式化内存 */
export function formatMemory(mb: number): string {
  if (mb < 0)
    return '-'
  return `${mb} MB`
}

/** 模板名简称 */
export function templateShortName(name: string): string {
  const found = TEMPLATE_CONFIGS.find(t => t.key === name)
  return found?.label || name
}
