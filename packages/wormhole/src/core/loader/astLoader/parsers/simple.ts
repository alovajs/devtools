import { AbstractAST, ASTType, SchemaObject, TCustom, TString } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const stringTypeParser = (schema: SchemaObject, init: AbstractAST) => {
  if (schema.format === 'binary') {
    return {
      ...init,
      type: ASTType.CUSTOM,
      params: 'Blob'
    } as TCustom;
  }
  return {
    ...init,
    type: ASTType.STRING
  } as TString;
};
export const simpleTypeParser = (schema: SchemaObject, ctx: ParserCtx) => {
  const result: AbstractAST = initAST(schema, ctx);
  switch (schema.type) {
    case 'boolean':
      result.type = ASTType.BOOLEAN;
      break;
    case 'integer':
    case 'number':
      result.type = ASTType.NUMBER;
      break;
    case 'string': {
      return stringTypeParser(schema, result);
    }
    case 'null':
    case null:
      result.type = ASTType.NULL;
      break;
    default:
      break;
  }
  return result;
};

export default <ASTParser>{
  type: ['boolean', 'integer', 'number', 'string', 'null'],
  parse: simpleTypeParser
};
