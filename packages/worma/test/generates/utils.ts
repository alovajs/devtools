import type { GeneratorResult } from '@/core/loader/astLoader/generates'
import { normalizeCode } from '@/core/loader/astLoader/generates/utils'

export function normalizeString(str?: string) {
  if (!str)
    return ''
  return str
    .replace(/\s+/g, ' ') // merge consecutive spaces
    .replace(/\n/g, '') // remove newlines
    .trim() // trim leading/trailing whitespace
}

export async function normalizeGeneratorResult(result: GeneratorResult): Promise<GeneratorResult> {
  return {
    name: result.name,
    type: result.type,
    comment: normalizeString(result.comment),
    code: await normalizeCode(result.code, result.type),
  }
}
