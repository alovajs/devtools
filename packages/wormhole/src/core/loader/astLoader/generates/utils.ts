import { CommentHelper } from '@/helper';
import { AST } from '@/type';
import { format } from '@/utils';
import { ASTGenerator, GeneratorCtx, GeneratorOptions, GeneratorResult } from './type';

export const generate = (ast: AST, ctx: GeneratorCtx, generators: ASTGenerator[]) => {
  const generator = generators.find(generator => [generator.type].flat().includes(ast.type));
  if (generator) {
    return generator.generate(ast, ctx);
  }
  return null;
};

export const isRightGenerate = (ast: AST, generator: ASTGenerator) => [generator.type].flat().includes(ast.type);

export const getValue = (result: GeneratorResult, options: GeneratorOptions) =>
  options.deep || !result.name ? result.code : result.name;

export const setComment = (ast: AST, options: GeneratorOptions) => {
  const commenter = CommentHelper.load({
    type: options.commentType,
    comment: ast.comment
  });
  if (ast.deprecated) {
    commenter.add('[deprecated]');
  }
  ast.comment = commenter.end();
  return ast.comment ?? '';
};

export async function normalizeCode(code: string, type: GeneratorResult['type']) {
  const typeMap: Record<
    GeneratorResult['type'],
    {
      reg: RegExp;
      transform: (code: string) => string;
    }
  > = {
    type: {
      reg: /type Ts =(.*)/s,
      transform(code: string): string {
        return `type Ts = ${code}`;
      }
    },
    interface: {
      reg: /interface Ts (.*)/s,
      transform(code: string): string {
        return `interface Ts ${code}`;
      }
    },
    enum: {
      reg: /enum Ts (.*)/s,
      transform(code: string): string {
        return `enum Ts  ${code}`;
      }
    }
  };
  const tsStrFormat = await format(typeMap[type].transform(code), {
    semi: false // remove semicolon
  });
  const resultFormat = typeMap[type].reg.exec(tsStrFormat)?.[1] ?? '';
  return resultFormat.trim();
}
