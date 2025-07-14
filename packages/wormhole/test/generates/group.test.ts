import type { GeneratorCtx, GeneratorOptions } from '@/core/loader/astLoader/generates/type'
import type { TIntersection, TUnion } from '@/type'
import { astGenerate } from '@/core/loader/astLoader/generates'
import { groupTypeGenerator } from '@/core/loader/astLoader/generates/group'
import { ASTType } from '@/type'
import { normalizeGeneratorResult } from './utils'

describe('group Type Generator', () => {
  const defaultOptions: GeneratorOptions = {
    commentType: 'doc',
  }
  const defaultCtx: GeneratorCtx = {
    path: ['$'],
    options: defaultOptions,
    next: astGenerate,
  }
  it('should generate union type', async () => {
    const ast: TUnion = {
      type: ASTType.UNION,
      keyName: 'Status',
      comment: 'Status type',
      params: [
        {
          type: ASTType.STRING,
          comment: 'String status',
        },
        {
          type: ASTType.NUMBER,
          comment: 'Numeric status',
        },
      ],
    }
    const result = await normalizeGeneratorResult(groupTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'Status',
      comment: `
      /**
       * Status type 
       */`,
      type: 'type',
      code: 'string | number',
    })
    expect(result).toEqual(expectResult)
  })

  it('should generate intersection type', async () => {
    const ast: TIntersection = {
      type: ASTType.INTERSECTION,
      keyName: 'UserWithRole',
      comment: 'User with role',
      params: [
        {
          type: ASTType.INTERFACE,
          params: [
            {
              keyName: 'name',
              isRequired: false,
              ast: {
                type: ASTType.STRING,
              },
            },
          ],
        },
        {
          type: ASTType.INTERFACE,
          params: [
            {
              keyName: 'role',
              isRequired: false,
              ast: {
                type: ASTType.STRING,
              },
            },
          ],
        },
      ],
    }
    const result = await normalizeGeneratorResult(groupTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'UserWithRole',
      comment: `
      /**
       * User with role
       */`,
      type: 'type',
      code: `{ 
        name?:string 
      } & { 
        role?:string 
      }`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle complex nested types', async () => {
    const ast: TUnion = {
      type: ASTType.UNION,
      keyName: 'ComplexType',
      params: [
        {
          type: ASTType.INTERSECTION,
          params: [
            {
              type: ASTType.INTERFACE,
              params: [
                {
                  keyName: 'id',
                  isRequired: false,
                  ast: {
                    type: ASTType.NUMBER,
                  },
                },
              ],
            },
            {
              type: ASTType.INTERFACE,
              params: [
                {
                  keyName: 'name',
                  isRequired: false,
                  ast: {
                    type: ASTType.STRING,
                  },
                },
              ],
            },
          ],
        },
        {
          type: ASTType.INTERFACE,
          params: [
            {
              keyName: 'code',
              isRequired: false,
              ast: {
                type: ASTType.STRING,
              },
            },
          ],
        },
      ],
    }
    const result = await normalizeGeneratorResult(groupTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'ComplexType',
      comment: '',
      type: 'type',
      code: `{ 
        id?:number 
      } & {
        name?:string 
      } | {
        code?:string 
      }`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should handle deep option', async () => {
    const ast: TUnion = {
      type: ASTType.UNION,
      keyName: 'DeepTest',
      params: [
        {
          type: ASTType.INTERFACE,
          keyName: 'A',
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
        {
          type: ASTType.INTERFACE,
          keyName: 'B',
          params: [
            {
              keyName: 'value',
              isRequired: false,
              ast: {
                type: ASTType.NUMBER,
              },
            },
          ],
        },
      ],
    }
    const result = await normalizeGeneratorResult(
      groupTypeGenerator(ast, { ...defaultCtx, options: { ...defaultOptions, deep: true } }),
    )
    const expectResult = await normalizeGeneratorResult({
      name: 'DeepTest',
      comment: '',
      type: 'type',
      code: `{ 
        value?:string 
      } | {
        value?:number 
      }`,
    })
    expect(result).toEqual(expectResult)
  })
})
