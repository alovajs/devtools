import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { AST, TupleSchemaObject } from '@/type'
import { tupleTypeParser } from '@/core/loader/astLoader/parsers/tuple'
import { ASTType } from '@/type'

// Mock CommentHelper
vi.mock('@/helper', () => ({
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

describe('tuple Type Parser', () => {
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

  describe('tupleTypeParser', () => {
    it('should parse tuple with multiple item types', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string', description: 'First item is string' },
          { type: 'number', description: 'Second item is number' },
          { type: 'boolean', description: 'Third item is boolean' },
        ],
        minItems: 2,
        maxItems: 3,
        description: 'A tuple with mixed types',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'First item is string',
      }

      const mockNumberAST: AST = {
        type: ASTType.NUMBER,
        keyName: '',
        comment: 'Second item is number',
      }

      const mockBooleanAST: AST = {
        type: ASTType.BOOLEAN,
        keyName: '',
        comment: 'Third item is boolean',
      }

      const ctx = createMockCtx('mixedTuple')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)
        .mockReturnValueOnce(mockBooleanAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.keyName).toBe('mixedTuple')
      expect(result.comment).toContain('A tuple with mixed types')
      expect(result.minItems).toBe(2)
      expect(result.maxItems).toBe(3)
      expect(result.params).toHaveLength(3)
      expect(result.params[0]).toBe(mockStringAST)
      expect(result.params[1]).toBe(mockNumberAST)
      expect(result.params[2]).toBe(mockBooleanAST)

      expect(ctx.next).toHaveBeenCalledTimes(3)
      expect(ctx.next).toHaveBeenNthCalledWith(1, schema.items[0], ctx.options)
      expect(ctx.next).toHaveBeenNthCalledWith(2, schema.items[1], ctx.options)
      expect(ctx.next).toHaveBeenNthCalledWith(3, schema.items[2], ctx.options)
    })

    it('should parse tuple with single item type', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string', description: 'Only string item' },
        ],
        description: 'Single item tuple',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'Only string item',
      }

      const ctx = createMockCtx('singleTuple')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.params).toHaveLength(1)
      expect(result.params[0]).toBe(mockStringAST)
      expect(result.minItems).toBeUndefined()
      expect(result.maxItems).toBeUndefined()
    })

    it('should parse empty tuple', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [],
        description: 'Empty tuple',
      }

      const ctx = createMockCtx('emptyTuple')

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.params).toHaveLength(0)
      expect(ctx.next).not.toHaveBeenCalled()
    })

    it('should handle tuple with nested objects', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
            description: 'User object',
          },
          { type: 'string', description: 'Status string' },
        ],
        description: 'Tuple with nested object',
      }

      const mockObjectAST: AST = {
        type: ASTType.INTERFACE,
        keyName: '',
        comment: 'User object',
        params: [
          { ast: { type: ASTType.NUMBER, keyName: 'id' }, keyName: 'id', isRequired: false },
          { ast: { type: ASTType.STRING, keyName: 'name' }, keyName: 'name', isRequired: false },
        ],
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'Status string',
      }

      const ctx = createMockCtx('nestedTuple')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockObjectAST)
        .mockReturnValueOnce(mockStringAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.params).toHaveLength(2)
      expect(result.params[0]).toBe(mockObjectAST)
      expect(result.params[1]).toBe(mockStringAST)
    })

    it('should handle tuple with arrays', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of strings',
          },
          {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of numbers',
          },
        ],
        description: 'Tuple with arrays',
      }

      const mockStringArrayAST: AST = {
        type: ASTType.ARRAY,
        keyName: '',
        comment: 'Array of strings',
        params: { type: ASTType.STRING, keyName: '' },
      }

      const mockNumberArrayAST: AST = {
        type: ASTType.ARRAY,
        keyName: '',
        comment: 'Array of numbers',
        params: { type: ASTType.NUMBER, keyName: '' },
      }

      const ctx = createMockCtx('arrayTuple')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringArrayAST)
        .mockReturnValueOnce(mockNumberArrayAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.params).toHaveLength(2)
      expect(result.params[0]).toBe(mockStringArrayAST)
      expect(result.params[1]).toBe(mockNumberArrayAST)
    })

    it('should generate deep comments for items with comments', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string', description: 'First item comment' },
          { type: 'number', description: 'Second item comment' },
          { type: 'boolean' }, // No comment
        ],
        description: 'Tuple with item comments',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'First item comment',
      }

      const mockNumberAST: AST = {
        type: ASTType.NUMBER,
        keyName: '',
        comment: 'Second item comment',
      }

      const mockBooleanAST: AST = {
        type: ASTType.BOOLEAN,
        keyName: '',
      }

      const ctx = createMockCtx('commentedTuple')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)
        .mockReturnValueOnce(mockBooleanAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.deepComment).toBeDefined()
      expect(result.deepComment).toContain('[params1] start')
      expect(result.deepComment).toContain('First item comment')
      expect(result.deepComment).toContain('[params1] end')
      expect(result.deepComment).toContain('[params2] start')
      expect(result.deepComment).toContain('Second item comment')
      expect(result.deepComment).toContain('[params2] end')
      // Third item should not appear in deep comments since it has no comment
    })

    it('should handle tuple with deep comments from nested items', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string', description: 'String item' },
        ],
        description: 'Tuple with deep comments',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'String item',
        deepComment: 'Deep comment from nested parsing',
      }

      const ctx = createMockCtx('deepCommentTuple')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.deepComment).toBeDefined()
      expect(result.deepComment).toContain('[params1] start')
      expect(result.deepComment).toContain('String item')
      expect(result.deepComment).toContain('Deep comment from nested parsing')
      expect(result.deepComment).toContain('[params1] end')
    })

    it('should handle tuple with title', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        title: 'Coordinate Tuple',
        items: [
          { type: 'number', description: 'X coordinate' },
          { type: 'number', description: 'Y coordinate' },
        ],
        description: 'A coordinate tuple',
      }

      const mockXAST: AST = { type: ASTType.NUMBER, keyName: '', comment: 'X coordinate' }
      const mockYAST: AST = { type: ASTType.NUMBER, keyName: '', comment: 'Y coordinate' }

      const ctx = createMockCtx('coordinate')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockXAST)
        .mockReturnValueOnce(mockYAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.comment).toContain('[title] Coordinate Tuple')
      expect(result.comment).toContain('A coordinate tuple')
    })

    it('should handle deprecated tuple', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
        ],
        deprecated: true,
        description: 'Deprecated tuple',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }

      const ctx = createMockCtx('deprecatedTuple')
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.deprecated).toBe(true)
    })

    it('should handle tuple with only minItems specified', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' },
        ],
        minItems: 1,
        description: 'Tuple with min items only',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }
      const mockNumberAST: AST = { type: ASTType.NUMBER, keyName: '' }

      const ctx = createMockCtx('minItemsTuple')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.minItems).toBe(1)
      expect(result.maxItems).toBeUndefined()
    })

    it('should handle tuple with only maxItems specified', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' },
        ],
        maxItems: 5,
        description: 'Tuple with max items only',
      }

      const mockStringAST: AST = { type: ASTType.STRING, keyName: '' }
      const mockNumberAST: AST = { type: ASTType.NUMBER, keyName: '' }

      const ctx = createMockCtx('maxItemsTuple')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockStringAST)
        .mockReturnValueOnce(mockNumberAST)

      const result = tupleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.TUPLE)
      expect(result.minItems).toBeUndefined()
      expect(result.maxItems).toBe(5)
    })
  })
})
