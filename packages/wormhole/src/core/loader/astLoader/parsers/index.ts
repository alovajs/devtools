import type { ParserCtx, ParserOptions } from './type'
import type { MaybeSchemaObject, TUnknown } from '@/type'
import { ASTType } from '@/type'
import arrayParser from './array'
import enumParser from './enum'
import groupParser from './group'
import objectParser from './object'
import referenceParser from './reference'
import simpleParser from './simple'
import tupleParser from './tuple'
import { getParserSchemaType, parse } from './utils'

export * from './type'

export function astParse(schema: MaybeSchemaObject, options: ParserOptions) {
  const doParse = (schema: MaybeSchemaObject, ctx: ParserCtx) => {
    const value = parse(schema, {
      type: getParserSchemaType(schema),
      ctx,
      parsers: [arrayParser, objectParser, enumParser, simpleParser, referenceParser, tupleParser, groupParser],
    })
    if (!value) {
      return {
        type: ASTType.UNKNOWN,
      } as TUnknown
    }
    return value
  }
  const ctx: ParserCtx = {
    options,
    next(schema, options) {
      const hasPathKey = !!ctx.pathKey
      if (hasPathKey) {
        ctx.path.push(ctx.pathKey!)
        ctx.pathKey = ''
      }
      ctx.options = options
      const nextAST = doParse(schema, ctx)
      if (hasPathKey) {
        ctx.path.pop()
      }
      return nextAST
    },
    keyName: '',
    visited: new Set(),
    pathMap: new Map(),
    path: ['$'],
  }

  return doParse(schema, ctx)
}
