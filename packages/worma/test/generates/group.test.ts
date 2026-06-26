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
  name?: string
} & {
  role?: string
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
  id?: number
} & {
  name?: string
} | {
  code?: string
}`,
    })
    expect(result).toEqual(expectResult)
  })

  it('should not add parens for ARRAY member in UNION', async () => {
    // UNION(|) with ARRAY member: `[]` binds tighter than `|`, no parens needed
    const ast: TUnion = {
      type: ASTType.UNION,
      keyName: 'UnionWithArray',
      params: [
        {
          type: ASTType.ARRAY,
          params: {
            type: ASTType.STRING,
          },
        },
        {
          type: ASTType.REFERENCE,
          params: 'Admin',
        },
      ],
    }
    const result = await normalizeGeneratorResult(groupTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'UnionWithArray',
      comment: '',
      type: 'type',
      code: 'string[] | Admin',
    })
    expect(result).toEqual(expectResult)
  })

  it('should add parens for UNION member in INTERSECTION', async () => {
    // INTERSECTION(&) with UNION member: `|` has lower precedence, parens REQUIRED
    // Without parens: string | number & Pet = string | (number & Pet)  WRONG
    // With parens:    (string | number) & Pet                        CORRECT
    const ast: TIntersection = {
      type: ASTType.INTERSECTION,
      keyName: 'IntersectionWithUnion',
      params: [
        {
          type: ASTType.UNION,
          params: [
            { type: ASTType.STRING },
            { type: ASTType.NUMBER },
          ],
        },
        {
          type: ASTType.REFERENCE,
          params: 'Pet',
        },
      ],
    }
    const result = await normalizeGeneratorResult(groupTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'IntersectionWithUnion',
      comment: '',
      type: 'type',
      code: '(string | number) & Pet',
    })
    expect(result).toEqual(expectResult)
  })

  it('should not add parens for ARRAY member in INTERSECTION', async () => {
    // INTERSECTION(&) with ARRAY member: `[]` binds tighter than `&`, no parens needed
    const ast: TIntersection = {
      type: ASTType.INTERSECTION,
      keyName: 'IntersectionWithArray',
      params: [
        {
          type: ASTType.ARRAY,
          params: {
            type: ASTType.REFERENCE,
            params: 'Pet',
          },
        },
        {
          type: ASTType.REFERENCE,
          params: 'User',
        },
      ],
    }
    const result = await normalizeGeneratorResult(groupTypeGenerator(ast, defaultCtx))
    const expectResult = await normalizeGeneratorResult({
      name: 'IntersectionWithArray',
      comment: '',
      type: 'type',
      code: 'Pet[] & User',
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
  value?: string
} | {
  value?: number
}`,
    })
    expect(result).toEqual(expectResult)
  })
})
