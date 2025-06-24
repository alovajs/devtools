import { AST, ASTType } from '@/type';
import { astGenerate } from '../index';
import { simpleTypeGenerator } from '../simple';
import { GeneratorOptions } from '../type';
import { normalizeGeneratorResult } from './utils';

describe('Simple Type Generator', () => {
  const defaultOptions: GeneratorOptions = {
    commentType: 'doc'
  };

  it('should generate boolean type', async () => {
    const ast: AST = {
      type: ASTType.BOOLEAN,
      keyName: 'isActive',
      comment: 'A boolean flag'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: defaultOptions, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'isActive',
      comment: `
      /**
       * A boolean flag
       */`,
      type: 'type',
      code: 'boolean'
    });
    expect(result).toEqual(expectResult);
  });

  it('should generate number type', async () => {
    const ast: AST = {
      type: ASTType.NUMBER,
      keyName: 'count',
      comment: 'A number value'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: defaultOptions, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'count',
      comment: `
      /**
       * A number value
       */`,
      type: 'type',
      code: 'number'
    });
    expect(result).toEqual(expectResult);
  });

  it('should generate string type', async () => {
    const ast: AST = {
      type: ASTType.STRING,
      keyName: 'name',
      comment: 'A string value'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: defaultOptions, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'name',
      comment: '/**\n* A string value\n */\n',
      type: 'type',
      code: 'string'
    });
    expect(result).toEqual(expectResult);
  });

  it('should generate literal type', async () => {
    const ast: AST = {
      type: ASTType.LITERAL,
      keyName: 'status',
      comment: 'A literal value',
      params: 'active'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: defaultOptions, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'status',
      comment: `
      /** 
       * A literal value
       */`,
      type: 'type',
      code: '"active"'
    });
    expect(result).toEqual(expectResult);
  });

  it('should generate reference type', async () => {
    const ast: AST = {
      type: ASTType.REFERENCE,
      keyName: 'user',
      comment: 'A reference type',
      params: 'User'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: defaultOptions, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'user',
      comment: `
      /**
       * A reference type
       */`,
      type: 'type',
      code: 'User'
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle missing comments', async () => {
    const ast: AST = {
      type: ASTType.STRING,
      keyName: 'name'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: defaultOptions, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'name',
      comment: '',
      type: 'type',
      code: 'string'
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle different comment types', async () => {
    const ast: AST = {
      type: ASTType.STRING,
      keyName: 'name',
      comment: 'This is a line comment'
    };
    const result = await normalizeGeneratorResult(
      simpleTypeGenerator(ast, { options: { commentType: 'line' }, next: astGenerate })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'name',
      comment: '// This is a line comment',
      type: 'type',
      code: 'string'
    });
    expect(result).toEqual(expectResult);
  });
});
