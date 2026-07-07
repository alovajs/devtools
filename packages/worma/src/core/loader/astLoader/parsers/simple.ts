import type { ASTParser, ParserCtx } from './type'
import type { AbstractAST, SchemaObject, TCustom, TString } from '@/type'
import { ASTType } from '@/type'
import { initAST } from './utils'

export function stringTypeParser(schema: SchemaObject, init: AbstractAST) {
  if (schema.format === 'binary') {
    return {
      ...init,
      type: ASTType.CUSTOM,
      params: 'Blob',
    } as TCustom
  }
  return {
    ...init,
    type: ASTType.STRING,
  } as TString
}
export function simpleTypeParser(schema: SchemaObject, ctx: ParserCtx) {
  const result: AbstractAST = initAST(schema, ctx)
  switch (schema.type) {
    case 'boolean':
      result.type = ASTType.BOOLEAN
      break
    case 'integer':
    case 'number':
      result.type = ASTType.NUMBER
      break
    case 'string': {
      return stringTypeParser(schema, result)
    }
    case 'null':
    case null:
      result.type = ASTType.NULL
      break
    default:
      // custom
      result.type = ASTType.CUSTOM;
      (result as TCustom).params = `${schema.type}` as string
      break
  }
  return result
}

export default <ASTParser>{
  type: ['boolean', 'integer', 'number', 'string', 'null', 'custom'],
  parse: simpleTypeParser,
}
