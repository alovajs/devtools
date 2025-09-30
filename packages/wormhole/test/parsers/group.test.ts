import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { AST, SchemaObject } from '@/type'
import { groupTypeParser } from '@/core/loader/astLoader/parsers/group'
import { logger } from '@/helper'
import { ASTType } from '@/type'

// Mock CommentHelper
vi.mock('@/helper', () => ({
  logger: {
    throwError: vi.fn((message: string, data?: any) => {
      const error = new Error(message)
      ;(error as any).data = data
      throw error
    }),
  },
  CommentHelper: {
    load: vi.fn(() => ({
      add: vi.fn().mockReturnThis(),
      end: vi.fn().mockImplementation(function (this: any) {
        // Mock the comment generation logic
        const calls = this.add.mock.calls
        let comment = ''
        for (const call of calls) {
          if (call.length === 2 && call[0] === '[title]') {
            comment += `[title] ${call[1]}\n`
          }
          else if (call.length === 1) {
            comment += `${call[0]}\n`
          }
        }
        return comment.trim()
      }),
    })),
    parse: vi.fn((str: string) => str ? str.split('\n') : []),
    parseStr: vi.fn((str: string) => str || ''),
  },
}))

describe('group Type Parser', () => {
  const defaultOptions: ParserOptions = {
    commentType: 'doc',
    document: {} as any,
    defaultRequire: false,
  }

  const createMockCtx = (keyName = ''): ParserCtx => {
    const mockNext = vi.fn()
    return {
      next: mockNext,
      keyName,
      pathKey: '',
      visited: new Set(),
      pathMap: new Map(),
      path: ['$'],
      options: defaultOptions,
    }
  }

  describe('groupTypeParser', () => {
    it('should parse anyOf as union type', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string', description: 'String option' },
          { type: 'number', description: 'Number option' },
          { type: 'boolean', description: 'Boolean option' },
        ],
        description: 'Union of multiple types',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'String option',
      }

      const mockNumberAST: AST = {
        type: ASTType.NUMBER,
        keyName: '',
        comment: 'Number option',
      }

      const mockBooleanAST: AST = {
        type: ASTType.BOOLEAN,
        keyName: '',
        comment: 'Boolean option',
      }

      const ctx = createMockCtx('unionType')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)
        .mockReturnValueOnce(mockBooleanAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.keyName).toBe('unionType')
      expect(result.comment).toContain('Union of multiple types')
      expect(result.params).toHaveLength(3)
      expect(result.params[0]).toBe(mockStringAST)
      expect(result.params[1]).toBe(mockNumberAST)
      expect(result.params[2]).toBe(mockBooleanAST)

      expect(ctx.next).toHaveBeenCalledTimes(3)
      expect(ctx.next).toHaveBeenNthCalledWith(1, schema.anyOf![0], ctx.options)
      expect(ctx.next).toHaveBeenNthCalledWith(2, schema.anyOf![1], ctx.options)
      expect(ctx.next).toHaveBeenNthCalledWith(3, schema.anyOf![2], ctx.options)
    })

    it('should parse oneOf as union type', () => {
      const schema: SchemaObject = {
        oneOf: [
          { type: 'string', description: 'Exactly string' },
          { type: 'number', description: 'Exactly number' },
        ],
        description: 'Exactly one of these types',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'Exactly string',
      }

      const mockNumberAST: AST = {
        type: ASTType.NUMBER,
        keyName: '',
        comment: 'Exactly number',
      }

      const ctx = createMockCtx('oneOfType')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.keyName).toBe('oneOfType')
      expect(result.params).toHaveLength(2)
      expect(result.params[0]).toBe(mockStringAST)
      expect(result.params[1]).toBe(mockNumberAST)
    })

    it('should parse allOf as intersection type', () => {
      const schema: SchemaObject = {
        allOf: [
          {
            type: 'object',
            properties: {
              id: { type: 'number' },
            },
            description: 'Base object with id',
          },
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            description: 'Object with name',
          },
        ],
        description: 'Intersection of multiple objects',
      }

      const mockBaseAST: AST = {
        type: ASTType.INTERFACE,
        keyName: '',
        comment: 'Base object with id',
        params: [
          { ast: { type: ASTType.NUMBER, keyName: 'id' }, keyName: 'id', isRequired: false },
        ],
      }

      const mockNameAST: AST = {
        type: ASTType.INTERFACE,
        keyName: '',
        comment: 'Object with name',
        params: [
          { ast: { type: ASTType.STRING, keyName: 'name' }, keyName: 'name', isRequired: false },
        ],
      }

      const ctx = createMockCtx('intersectionType')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockBaseAST)
        .mockReturnValueOnce(mockNameAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.INTERSECTION)
      expect(result.keyName).toBe('intersectionType')
      expect(result.comment).toContain('Intersection of multiple objects')
      expect(result.params).toHaveLength(2)
      expect(result.params[0]).toBe(mockBaseAST)
      expect(result.params[1]).toBe(mockNameAST)
    })

    it('should handle empty anyOf array', () => {
      const schema: SchemaObject = {
        anyOf: [],
        description: 'Empty union',
      }

      const ctx = createMockCtx('emptyUnion')

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.params).toHaveLength(0)
      expect(ctx.next).not.toHaveBeenCalled()
    })

    it('should handle empty allOf array', () => {
      const schema: SchemaObject = {
        allOf: [],
        description: 'Empty intersection',
      }

      const ctx = createMockCtx('emptyIntersection')

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.INTERSECTION)
      expect(result.params).toHaveLength(0)
      expect(ctx.next).not.toHaveBeenCalled()
    })

    it('should prioritize anyOf over allOf when both are present', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string' },
        ],
        allOf: [
          { type: 'number' },
        ],
        description: 'Schema with both anyOf and allOf',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }

      const ctx = createMockCtx('bothTypes')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.params).toHaveLength(1)
      expect(result.params[0]).toBe(mockStringAST)
      expect(ctx.next).toHaveBeenCalledTimes(1)
      expect(ctx.next).toHaveBeenCalledWith(schema.anyOf![0], ctx.options)
    })

    it('should prioritize oneOf over allOf when both are present', () => {
      const schema: SchemaObject = {
        oneOf: [
          { type: 'string' },
        ],
        allOf: [
          { type: 'number' },
        ],
        description: 'Schema with both oneOf and allOf',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }

      const ctx = createMockCtx('oneOfAndAllOf')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.params).toHaveLength(1)
      expect(result.params[0]).toBe(mockStringAST)
    })

    it('should generate deep comments for items with comments', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string', description: 'String with comment' },
          { type: 'number', description: 'Number with comment' },
          { type: 'boolean' }, // No comment
        ],
        description: 'Union with item comments',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'String with comment',
      }

      const mockNumberAST: AST = {
        type: ASTType.NUMBER,
        keyName: '',
        comment: 'Number with comment',
      }

      const mockBooleanAST: AST = {
        type: ASTType.BOOLEAN,
        keyName: '',
      }

      const ctx = createMockCtx('commentedUnion')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)
        .mockReturnValueOnce(mockBooleanAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.deepComment).toContain('[params1] start')
      expect(result.deepComment).toContain('String with comment')
      expect(result.deepComment).toContain('[params2] start')
      expect(result.deepComment).toContain('Number with comment')
    })

    it('should handle nested group types', () => {
      const schema: SchemaObject = {
        anyOf: [
          {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
            ],
            description: 'Nested oneOf',
          },
          { type: 'boolean', description: 'Boolean option' },
        ],
        description: 'Union with nested group',
      }

      const mockNestedUnionAST: AST = {
        type: ASTType.UNION,
        keyName: '',
        comment: 'Nested oneOf',
        params: [
          { type: ASTType.STRING, keyName: '' },
          { type: ASTType.NUMBER, keyName: '' },
        ],
      }

      const mockBooleanAST: AST = {
        type: ASTType.BOOLEAN,
        keyName: '',
        comment: 'Boolean option',
      }

      const ctx = createMockCtx('nestedGroup')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockNestedUnionAST)
        .mockReturnValueOnce(mockBooleanAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.params).toHaveLength(2)
      expect(result.params[0]).toBe(mockNestedUnionAST)
      expect(result.params[1]).toBe(mockBooleanAST)
    })

    it('should handle group with title', () => {
      const schema: SchemaObject = {
        title: 'String or Number',
        anyOf: [
          { type: 'string' },
          { type: 'number' },
        ],
        description: 'A union type with title',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }
      const mockNumberAST: AST = { type: ASTType.NUMBER, keyName: '' }

      const ctx = createMockCtx('titledUnion')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.comment).toContain('[title] String or Number')
      expect(result.comment).toContain('A union type with title')
    })

    it('should handle deprecated group', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string' },
        ],
        deprecated: true,
        description: 'Deprecated union',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }

      const ctx = createMockCtx('deprecatedUnion')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.deprecated).toBe(true)
    })

    it('should throw error when no group type is specified', () => {
      const schema: SchemaObject = {
        type: 'string',
        description: 'Schema without group types',
      }

      const ctx = createMockCtx('invalidGroup')

      expect(() => {
        groupTypeParser(schema, ctx)
      }).toThrow()

      expect(logger.throwError).toHaveBeenCalledWith(
        'schema must contain anyOf, oneOf or allOf',
        { schema },
      )
    })

    it('should handle single item in anyOf', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string', description: 'Single string option' },
        ],
        description: 'Union with single item',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'Single string option',
      }

      const ctx = createMockCtx('singleUnion')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.UNION)
      expect(result.params).toHaveLength(1)
      expect(result.params[0]).toBe(mockStringAST)
    })

    it('should handle single item in allOf', () => {
      const schema: SchemaObject = {
        allOf: [
          {
            type: 'object',
            properties: {
              id: { type: 'number' },
            },
            description: 'Single object',
          },
        ],
        description: 'Intersection with single item',
      }

      const mockObjectAST: AST = {
        type: ASTType.INTERFACE,
        keyName: '',
        comment: 'Single object',
        params: [
          { ast: { type: ASTType.NUMBER, keyName: 'id' }, keyName: 'id', isRequired: false },
        ],
      }

      const ctx = createMockCtx('singleIntersection')
      ctx.next = vi.fn().mockReturnValue(mockObjectAST)

      const result = groupTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.INTERSECTION)
      expect(result.params).toHaveLength(1)
      expect(result.params[0]).toBe(mockObjectAST)
    })
  })
})
