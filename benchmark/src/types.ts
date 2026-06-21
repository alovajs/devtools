/** 单次 benchmark 原始结果 */
export interface BenchmarkResult {
  tool: string
  scale: number
  timeMs: number
  memoryMB: number
  fileCount: number
  totalSize: number
  files: string[]
  version: string
  error: string | null
}

/** 聚合后的 benchmark 结果 */
export interface AggregatedResult {
  tool: string
  scale: number
  timeMs: number
  memoryMB: number
  fileCount: number
  totalSize: number
  files: string[]
  version: string
  error: string | null
  avgTimeMs: number
  minTimeMs: number
  maxTimeMs: number
  avgTotalSize?: number
  avgMemoryMB?: number
  iterations: number
}

/** 完整的 benchmark 报告 */
export interface BenchmarkReport {
  results: AggregatedResult[]
  rawResults: BenchmarkResult[]
  timestamp: string
}

/** SSE 进度事件 */
export interface ProgressEvent {
  tool: string
  scale: number
  iteration: number
  totalIterations: number
  progress: number
  status: 'running' | 'done' | 'error'
  result?: BenchmarkResult
}

/** 工具显示配置 */
export interface ToolDisplay {
  key: string
  label: string
  color: string
  description: string
}

export const TOOL_CONFIGS: ToolDisplay[] = [
  { key: 'worma', label: 'Worma', color: '#1677ff', description: '多模板预设、AI Doc、全局式 API' },
  { key: 'openapi-typescript', label: 'openapi-ts', color: '#52c41a', description: '纯类型生成，单个 .d.ts 文件' },
  { key: '@hey-api/openapi-ts', label: '@hey-api', color: '#fa8c16', description: '类型 + 请求客户端，模块化输出' },
]

export const SCALE_OPTIONS = [200, 500, 1000, 5000]

/** 格式化字节 */
export function formatBytes(bytes: number): string {
  if (bytes < 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** 格式化时间 */
export function formatTime(ms: number): string {
  if (ms < 0) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** 格式化内存 */
export function formatMemory(mb: number): string {
  if (mb < 0) return '-'
  return `${mb} MB`
}

/** 工具名简称 */
export function toolShortName(name: string): string {
  const found = TOOL_CONFIGS.find(t => t.key === name)
  return found?.label || name
}
