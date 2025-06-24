import { AST } from '@/type';
import { astGenerate } from './generates';
import { GeneratorOptions } from './generates/type';

export const transformAST = (ast: AST, options: GeneratorOptions) => {
  const result = astGenerate(ast, options);
  console.log(result, 7);
};
export default {
  transformAST
};
