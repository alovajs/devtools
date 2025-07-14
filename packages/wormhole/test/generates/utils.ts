import type { GeneratorResult } from '@/core/loader/astLoader/generates'
import { normalizeCode } from '@/core/loader/astLoader/generates/utils'

export function normalizeString(str?: string) {
  if (!str)
    return ''
  return str
    .replace(/\s+/g, ' ') // 合并连续空格
    .replace(/\n/g, '') // 删除换行
    .trim() // 去除首尾空格
}

export async function normalizeGeneratorResult(result: GeneratorResult): Promise<GeneratorResult> {
  return {
    name: result.name,
    type: result.type,
    comment: normalizeString(result.comment),
    code: await normalizeCode(result.code, result.type),
  }
}
