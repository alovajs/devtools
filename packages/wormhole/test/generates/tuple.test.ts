import type { GeneratorCtx, GeneratorOptions } from '@/core/loader/astLoader/generates/type'
import type { TTuple } from '@/type'
import { astGenerate } from '@/core/loader/astLoader/generates'
import { tupleTypeGenerator } from '@/core/loader/astLoader/generates/tuple'
import { ASTType } from '@/type'
import { normalizeGeneratorResult } from './utils'

describe('tuple Type Generator', () => {
  const defaultOptions: GeneratorOptions = {
    commentType: 'doc',
  }
  const defaultCtx: GeneratorCtx = {
    path: ['$'],
    options: defaultOptions,
    next: astGenerate,
  }
  it('should generate basic tuple type', async () => {
    const ast: TTuple = {
      type: ASTType.TUPLE,
      keyName: 'Point',
      comment: 'Point tuple',
      params: [
        {
          type: ASTType.NUMBER,
        },
        {
          type: ASTType.NUMBER,
        },
      ],
    }
    const ts = tupleTypeGenerator(ast, defaultCtx)
    const result = await normalizeGeneratorResult(ts)
    const expectResult = await normalizeGeneratorResult({
      name: 'Point',
      comment: `
      /**
       * Point tuple
       */`,
      type: 'type',
      code: `[
      number,
      number
      ]`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle minItems with spread parameter', async () => {
    const ast: TTuple = {
      type: ASTType.TUPLE,
      keyName: 'MinArray',
      comment: 'Array with minimum items',
      params: [
        {
          type: ASTType.STRING,
        },
      ],
      minItems: 3,
      spreadParam: {
        type: ASTType.STRING,
      },
    }
    const result = await normalizeGeneratorResult(tupleTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'MinArray',
      comment: `
      /**
       * Array with minimum items
       */`,
      type: 'type',
      code: `[
        string,
        string,
        string,
        ...Array<string>
      ]`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle maxItems with union types', async () => {
    const ast: TTuple = {
      type: ASTType.TUPLE,
      keyName: 'MaxArray',
      params: [
        {
          type: ASTType.NUMBER,
        },
      ],
      minItems: 1,
      maxItems: 3,
      spreadParam: {
        type: ASTType.NUMBER,
      },
    }
    const result = await normalizeGeneratorResult(tupleTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'MaxArray',
      comment: '',
      type: 'type',
      code: `[
        number
      ] | [
        number, 
        number
      ] | [
        number,
        number,
        number
      ]`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle infinite spread with maxItems < minItems', async () => {
    const ast: TTuple = {
      type: ASTType.TUPLE,
      keyName: 'InfiniteArray',
      params: [
        {
          type: ASTType.STRING,
        },
      ],
      minItems: 2,
      maxItems: 1,
      spreadParam: {
        type: ASTType.STRING,
      },
    }
    const result = await normalizeGeneratorResult(tupleTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'InfiniteArray',
      comment: '',
      type: 'type',
      code: `[
        string,
        string,
        ...Array<string>
      ]`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle complex tuple elements', async () => {
    const ast: TTuple = {
      type: ASTType.TUPLE,
      keyName: 'ComplexTuple',
      params: [
        {
          type: ASTType.STRING,
        },
        {
          type: ASTType.INTERFACE,
          params: [
            {
              keyName: 'x',
              isRequired: false,
              ast: {
                comment: 'X coordinate',
                type: ASTType.NUMBER,
              },
            },
            {
              keyName: 'y',
              isRequired: false,
              ast: {
                comment: 'Y coordinate',
                type: ASTType.NUMBER,
              },
            },
          ],
        },
      ],
    }
    const result = await normalizeGeneratorResult(tupleTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'ComplexTuple',
      comment: '',
      type: 'type',
      code: `[
        string,
        { 
          /**
           * X coordinate
           */
          x?: number
          /**
           * Y coordinate
           */
          y?: number
        }
      ]`,
    })
    expect(result).toEqual(expectResult)
  })
})
