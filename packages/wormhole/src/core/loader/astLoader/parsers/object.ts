import type { ASTParser, ParserCtx } from './type'
import type { AST, SchemaObject, TInterface } from '@/type'
import { ASTType } from '@/type'
import { initAST } from './utils'

export function objectTypeParser(schema: SchemaObject, ctx: ParserCtx): AST {
  const result: TInterface = {
    ...initAST(schema, ctx),
    type: ASTType.INTERFACE,
    params: [],
  }
  const properties = schema.properties || {}
  const required = new Set(schema.required ?? [])
  for (const [key, value] of Object.entries(properties)) {
    ctx.pathKey = key
    result.params.push({
      ast: ctx.next(value, ctx.options),
      keyName: key,
      isRequired: required.has(key) || !!ctx.options.defaultRequire,
    })
  }
  if (!result.params.length && !schema.additionalProperties) {
    return {
      ...result,
      type: ASTType.OBJECT,
    }
  }
  if (schema.additionalProperties) {
    if (typeof schema.additionalProperties === 'boolean') {
      result.addParams = {
        type: ASTType.ANY,
      }
    }
    else {
      ctx.pathKey = '[key: string]'
      result.addParams = ctx.next(schema.additionalProperties, ctx.options)
    }
  }
  return result
}

export default <ASTParser>{
  type: 'object',
  parse: objectTypeParser,
}
