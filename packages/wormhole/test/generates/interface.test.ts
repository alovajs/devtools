import { astGenerate } from '@/core/loader/astLoader/generates/index';
import { interfaceTypeGenerator } from '@/core/loader/astLoader/generates/interface';
import { GeneratorCtx, GeneratorOptions } from '@/core/loader/astLoader/generates/type';
import { ASTType, TInterface } from '@/type';
import { normalizeGeneratorResult } from './utils';

describe('Interface Type Generator', () => {
  const defaultOptions: GeneratorOptions = {
    commentType: 'doc'
  };
  const defaultCtx: GeneratorCtx = {
    path: ['$'],
    options: defaultOptions,
    next: astGenerate
  };
  it('should generate interface with basic types', async () => {
    const ast: TInterface = {
      type: ASTType.INTERFACE,
      keyName: 'User',
      comment: 'User interface',
      params: [
        {
          keyName: 'id',
          isRequired: false,
          ast: {
            type: ASTType.NUMBER,
            comment: 'User ID'
          }
        },
        {
          keyName: 'name',
          isRequired: true,
          ast: {
            type: ASTType.STRING,
            comment: 'User name'
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(interfaceTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'User',
      comment: `
      /**
       * User interface
      */`,
      type: 'interface',
      code: `{
        /**
         * User ID
         */
        id?:number
        /**
         * User name
         */
        name:string
      }`
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle nested interfaces', async () => {
    const ast: TInterface = {
      type: ASTType.INTERFACE,
      keyName: 'Address',
      params: [
        {
          keyName: 'street',
          isRequired: false,
          ast: {
            type: ASTType.STRING
          }
        },
        {
          keyName: 'location',
          isRequired: false,
          ast: {
            type: ASTType.INTERFACE,
            params: [
              {
                keyName: 'lat',
                isRequired: false,
                ast: {
                  type: ASTType.NUMBER
                }
              },
              {
                keyName: 'lng',
                isRequired: false,
                ast: {
                  type: ASTType.NUMBER
                }
              }
            ]
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(interfaceTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'Address',
      comment: '',
      type: 'interface',
      code: `{
        street?:string
        location?:{
          lat?:number
          lng?:number
        }
      }`
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle invalid identifier names', async () => {
    const ast: TInterface = {
      type: ASTType.INTERFACE,
      keyName: 'InvalidProps',
      params: [
        {
          keyName: '123-invalid',
          isRequired: false,
          ast: {
            type: ASTType.STRING
          }
        },
        {
          keyName: 'valid-name',
          isRequired: false,
          ast: {
            type: ASTType.NUMBER
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(interfaceTypeGenerator(ast, defaultCtx));
    const expectResult = await normalizeGeneratorResult({
      name: 'InvalidProps',
      comment: '',
      type: 'interface',
      code: `{
        "123-invalid"?:string
        "valid-name"?:number
       }`
    });
    expect(result).toEqual(expectResult);
  });

  it('should handle deep option', async () => {
    const ast: TInterface = {
      type: ASTType.INTERFACE,
      keyName: 'DeepTest',
      params: [
        {
          keyName: 'nested',
          isRequired: false,
          ast: {
            type: ASTType.INTERFACE,
            keyName: 'Nested',
            params: [
              {
                keyName: 'value',
                isRequired: false,
                ast: {
                  type: ASTType.STRING
                }
              }
            ]
          }
        }
      ]
    };
    const result = await normalizeGeneratorResult(
      interfaceTypeGenerator(ast, { ...defaultCtx, options: { ...defaultOptions, deep: true } })
    );
    const expectResult = await normalizeGeneratorResult({
      name: 'DeepTest',
      comment: '',
      type: 'interface',
      code: `{
        nested?:{
          value?:string
        }
      }`
    });
    expect(result).toEqual(expectResult);
  });
});
