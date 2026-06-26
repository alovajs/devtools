import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type'
import type { TArray } from '@/type'
import { ASTType } from '@/type'
import { getValue, setComment } from './utils'

export function arrayTypeGenerator(ast: TArray, ctx: GeneratorCtx) {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: '',
  }
  ctx.pathKey = '[]'
  const paramsResult = ctx.next(ast.params, ctx.options)
  const tsStr = getValue(paramsResult, ctx.options)
  if (ast.params.type !== ASTType.INTERFACE || tsStr === paramsResult.name) {
    // Only wrap in parentheses when needed for operator precedence:
    // UNION / INTERSECTION / TUPLE elements need parens to prevent ambiguity
    // ENUM can produce union-like output (via otherEnumTypeGenerator), so also needs parens
    const needsParens = ast.params.type === ASTType.UNION
      || ast.params.type === ASTType.INTERSECTION
      || ast.params.type === ASTType.TUPLE
      || ast.params.type === ASTType.ENUM
    result.code = needsParens ? `(${tsStr})[]` : `${tsStr}[]`
  }
  else {
    result.code = `Array<${tsStr}>`
  }
  return result
}

export default <ASTGenerator>{
  type: ASTType.ARRAY,
  generate: arrayTypeGenerator,
}
