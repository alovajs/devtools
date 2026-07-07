import type { GeneratorOptions } from './generates/type'
import type { ParserOptions } from './parsers'
import type { AST, MaybeSchemaObject } from '@/type'
import { astGenerate, normalizeCode } from './generates'
import normalizer from './normalize'
import { astParse } from './parsers'

export interface TransformAstOptions extends GeneratorOptions {
  format?: boolean
}
export async function transformAST(ast: AST, options: TransformAstOptions) {
  const result = astGenerate(ast, options)
  if (options.format) {
    result.code = await normalizeCode(result.code, result.type)
  }
  return result
}

export async function transformSchema(schema: MaybeSchemaObject, options: ParserOptions) {
  const normalized = normalizer.normalize(schema)
  return astParse(normalized, options)
}
export { ParserOptions }
