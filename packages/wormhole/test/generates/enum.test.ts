import { astGenerate } from '@/core/loader/astLoader/generates';
import { enumTypeGenerator } from '@/core/loader/astLoader/generates/enum';
import { GeneratorCtx, GeneratorOptions } from '@/core/loader/astLoader/generates/type';
import { ASTType, TEnum } from '@/type';
import { normalizeGeneratorResult } from './utils';

describe('Enum Type Generator', () => {
  const defaultOptions: GeneratorOptions = {
    commentType: 'doc'
  };
  const defaultCtx: GeneratorCtx = {
    path: ['$'],
    options: defaultOptions,
    next: astGenerate
  };

  it('should generate normal enum with string literals', async () => {
    const ast: TEnum = {
      type: ASTType.ENUM,
      keyName: 'Status',
      comment: 'Status enum',
      params: [
        {
          keyName: 'ACTIVE',
          ast: {
            type: ASTType.LITERAL,
            params: 'active',
            comment: 'Active status'
          }
        },
        {
          keyName: 'INACTIVE',
          ast: {
            type: ASTType.LITERAL,
            params: 'inactive',
            comment: 'Inactive status'
          }
        }
      ]
    };

    const result = await normalizeGeneratorResult(enumTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'Status',
      comment: `
      /**
       * Status enum
       */
      `,
      type: 'enum',
      code: `{
        /** 
         * Active status 
         */
        ACTIVE = "active",
        /**
         * Inactive status
         */
        INACTIVE = "inactive"
      }`
    });
    expect(result).toEqual(expectResult);
  });

  it('should generate normal enum with number literals', async () => {
    const ast: TEnum = {
      type: ASTType.ENUM,
      keyName: 'Priority',
      comment: 'Priority enum',
      params: [
        {
          keyName: 'LOW',
          ast: {
            type: ASTType.LITERAL,
            params: 0
          }
        },
        {
          keyName: 'HIGH',
          ast: {
            type: ASTType.LITERAL,
            params: 1
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(enumTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'Priority',
      comment: `
      /**
       * Priority enum
       */`,
      type: 'enum',
      code: `{
        LOW = 0,
        HIGH = 1
      }`
    });
    expect(result).toEqual(expectResult);
  });

  it('should generate union type for mixed types', async () => {
    const ast: TEnum = {
      type: ASTType.ENUM,
      keyName: 'Mixed',
      comment: 'Mixed type enum',
      params: [
        {
          keyName: 'STRING',
          ast: {
            type: ASTType.STRING
          }
        },
        {
          keyName: 'NUMBER',
          ast: {
            type: ASTType.NUMBER
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(enumTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'Mixed',
      comment: `
      /**
       * Mixed type enum
       */`,
      type: 'type',
      code: 'string | number'
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle enum with valid identifier names', async () => {
    const ast: TEnum = {
      type: ASTType.ENUM,
      keyName: 'ValidNames',
      params: [
        {
          keyName: 'validName',
          ast: {
            type: ASTType.LITERAL,
            params: 'valid'
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(enumTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'ValidNames',
      comment: '',
      type: 'enum',
      code: `{
        validName = "valid"
      }`
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle enum with invalid identifier names', async () => {
    const ast: TEnum = {
      type: ASTType.ENUM,
      keyName: 'InvalidNames',
      params: [
        {
          keyName: '123-invalid',
          ast: {
            type: ASTType.LITERAL,
            params: 'invalid'
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(enumTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'InvalidNames',
      comment: '',
      type: 'enum',
      code: `{
        "123-invalid" = "invalid"
      }`
    });
    expect(result).toEqual(expectResult);
  });
});
