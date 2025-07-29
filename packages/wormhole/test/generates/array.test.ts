import type { GeneratorCtx, GeneratorOptions } from '@/core/loader/astLoader/generates/type'
import type { TArray } from '@/type'
import { astGenerate } from '@/core/loader/astLoader/generates'
import { arrayTypeGenerator } from '@/core/loader/astLoader/generates/array'
import { ASTType } from '@/type'
import { normalizeGeneratorResult } from './utils'

describe('array Type Generator', () => {
  const defaultOptions: GeneratorOptions = {
    commentType: 'doc',
  }
  const defaultCtx: GeneratorCtx = {
    path: ['$'],
    options: defaultOptions,
    next: astGenerate,
  }
  it('should generate array type with simple type', async () => {
    const ast: TArray = {
      type: ASTType.ARRAY,
      keyName: 'StringArray',
      comment: 'Array of strings',
      params: {
        type: ASTType.STRING,
      },
    }

    const result = await normalizeGeneratorResult(arrayTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'StringArray',
      comment: `
      /**
       * Array of strings
       */
      `,
      type: 'type',
      code: `string[]`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should generate array type with interface type', async () => {
    const ast: TArray = {
      type: ASTType.ARRAY,
      keyName: 'UserArray',
      comment: 'Array of users',
      params: {
        type: ASTType.INTERFACE,
        params: [
          {
            keyName: 'id',
            isRequired: false,
            ast: {
              type: ASTType.NUMBER,
            },
          },
          {
            keyName: 'name',
            isRequired: true,
            ast: {
              type: ASTType.STRING,
            },
          },
        ],
      },
    }

    const result = await normalizeGeneratorResult(arrayTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'UserArray',
      comment: `
      /**
       * Array of users
       */
      `,
      type: 'type',
      code: `Array<{
          id?:number
          name:string
        }>`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle deep option', async () => {
    const ast: TArray = {
      type: ASTType.ARRAY,
      keyName: 'DeepArray',
      params: {
        type: ASTType.INTERFACE,
        keyName: 'Item',
        params: [
          {
            keyName: 'value',
            isRequired: false,
            ast: {
              type: ASTType.STRING,
            },
          },
        ],
      },
    }

    const result = await normalizeGeneratorResult(
      arrayTypeGenerator(ast, { ...defaultCtx, options: { ...defaultOptions, deep: true } }),
    )
    const expectResult = await normalizeGeneratorResult({
      name: 'DeepArray',
      comment: ``,
      type: 'type',
      code: `Array<{
        value?:string 
      }>`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle array of arrays', async () => {
    const ast: TArray = {
      type: ASTType.ARRAY,
      keyName: 'Matrix',
      comment: 'Matrix of numbers',
      params: {
        type: ASTType.ARRAY,
        params: {
          type: ASTType.NUMBER,
        },
      },
    }

    const result = await normalizeGeneratorResult(arrayTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'Matrix',
      comment: `
      /**
       * Matrix of numbers
       */
      `,
      type: 'type',
      code: `number[][]`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle array of union types', async () => {
    const ast: TArray = {
      type: ASTType.ARRAY,
      keyName: 'MixedArray',
      params: {
        type: ASTType.UNION,
        params: [
          {
            type: ASTType.STRING,
          },
          {
            type: ASTType.NUMBER,
          },
        ],
      },
    }

    const result = await normalizeGeneratorResult(arrayTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'MixedArray',
      comment: ``,
      type: 'type',
      code: `(string | number)[]`,
    })
    expect(result).toEqual(expectResult)
  })
})
