import { AST, ASTType } from '@/type';
import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type';
import { setComment } from './utils';

export const simpleTypeGenerator = (ast: AST, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: ''
  };
  switch (ast.type) {
    case ASTType.BOOLEAN:
      result.code = 'boolean';
      break;
    case ASTType.NUMBER:
      result.code = 'number';
      break;
    case ASTType.STRING:
      result.code = 'string';
      break;
    case ASTType.OBJECT:
      result.code = 'object';
      break;
    case ASTType.ANY:
      result.code = 'any';
      break;
    case ASTType.NULL:
      result.code = 'null';
      break;
    case ASTType.UNKNOWN:
      result.code = 'unknown';
      break;
    case ASTType.NEVER:
      result.code = 'never';
      break;
    case ASTType.LITERAL:
      result.code = JSON.stringify(ast.params);
      break;
    case ASTType.REFERENCE: // reference
      result.code = ast.params;
      break;
    case ASTType.CUSTOM:
      result.code = ast.params;
      break;
    default:
      break;
  }
  return result;
};

export default <ASTGenerator>{
  type: [
    ASTType.BOOLEAN,
    ASTType.NUMBER,
    ASTType.STRING,
    ASTType.OBJECT,
    ASTType.ANY,
    ASTType.NULL,
    ASTType.UNKNOWN,
    ASTType.NEVER,
    ASTType.REFERENCE,
    ASTType.LITERAL,
    ASTType.CUSTOM
  ],
  generate: simpleTypeGenerator
};
