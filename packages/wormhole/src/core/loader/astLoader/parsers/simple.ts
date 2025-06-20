import { AbstractAST, ASTType, SchemaObject } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

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
    case 'string':
      result.type = ASTType.STRING;
      break;
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
