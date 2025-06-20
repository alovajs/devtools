import { ASTType, ReferenceObject, SchemaObject, TUnknown } from '@/type';
import { isReferenceObject } from '@/utils';
import { forward } from './forward';
import { ParserCtx, ParserOptions, ParserSchemaType } from './type';
import { parse } from './utils';

export const getParserSchemaType = (schema: SchemaObject | ReferenceObject): ParserSchemaType => {
  if (isReferenceObject(schema)) {
    return 'reference';
  }
  const forwardType = forward(schema);
  if (forwardType) {
    return forwardType;
  }
  if (schema.type && typeof schema.type === 'string') {
    return schema.type;
  }
  return 'null';
};
export const astParse = (schema: SchemaObject | ReferenceObject, options: ParserOptions) => {
  const ctx: ParserCtx = {
    options,
    next(schema, option) {
      const hasPathKey = !!ctx.pathKey;
      if (hasPathKey) {
        ctx.path.push(ctx.pathKey!);
        ctx.pathKey = '';
      }
      const nextAST = astParse(schema, option);
      if (hasPathKey) {
        ctx.path.pop();
      }
      return nextAST;
    },
    visited: new Set(),
    path: []
  };
  const value = parse(schema, {
    type: getParserSchemaType(schema),
    ctx,
    parsers: []
  });
  if (!value) {
    return {
      type: ASTType.UNKNOWN
    } as TUnknown;
  }
  return value;
};
