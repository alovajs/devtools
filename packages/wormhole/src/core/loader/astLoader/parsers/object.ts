import { AST, ASTType, SchemaObject, TInterface } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const objectTypeParser = (schema: SchemaObject, ctx: ParserCtx): AST => {
  const result: TInterface = {
    ...initAST(schema, ctx),
    type: ASTType.INTERFACE,
    params: []
  };
  const properties = schema.properties || {};
  const required = new Set(schema.required ?? []);
  for (const [key, value] of Object.entries(properties)) {
    result.params.push({
      ast: ctx.next(value, ctx.options),
      keyName: key,
      isRequired: required.has(key)
    });
  }
  if (!result.params.length) {
    return {
      ...result,
      type: ASTType.OBJECT
    };
  }
  return result;
};

export default <ASTParser>{
  type: 'object',
  parse: objectTypeParser
};
