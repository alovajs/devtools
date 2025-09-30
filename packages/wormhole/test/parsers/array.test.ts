import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { ArraySchemaObject, AST, TObject } from '@/type'
import { arrayTypeParser } from '@/core/loader/astLoader/parsers/array'
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

describe('array Type Parser', () => {
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

  describe('arrayTypeParser', () => {
    it('should parse array with string items', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'string',
          description: 'String item',
        },
        description: 'Array of strings',
      }

      const mockItemAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'String item',
      }

      const ctx = createMockCtx('stringArray')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.keyName).toBe('stringArray')
      expect(result.params).toBe(mockItemAST)
      expect(result.comment).toContain('Array of strings')
      expect(result.deepComment).toContain('[items] start')
      expect(result.deepComment).toContain('[items] end')
      expect(ctx.pathKey).toBe('[]')
      expect(ctx.next).toHaveBeenCalledWith(schema.items, ctx.options)
    })

    it('should parse array with number items', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'number',
          description: 'Number item',
        },
        description: 'Array of numbers',
      }

      const mockItemAST: AST = {
        type: ASTType.NUMBER,
        keyName: '',
        comment: 'Number item',
      }

      const ctx = createMockCtx('numberArray')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.keyName).toBe('numberArray')
      expect(result.params).toBe(mockItemAST)
      expect(result.comment).toContain('Array of numbers')
    })

    it('should parse array with object items', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          description: 'Object item',
        },
        description: 'Array of objects',
      }

      const mockItemAST: TObject = {
        type: ASTType.OBJECT,
        keyName: '',
        comment: 'Object item',
      }

      const ctx = createMockCtx('objectArray')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.keyName).toBe('objectArray')
      expect(result.params).toBe(mockItemAST)
      expect(result.comment).toContain('Array of objects')
    })

    it('should parse nested array', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Nested array item',
        },
        description: 'Array of arrays',
      }

      const mockNestedItemAST: AST = {
        type: ASTType.ARRAY,
        keyName: '',
        comment: 'Nested array item',
        params: {
          type: ASTType.STRING,
          keyName: '',
        },
      }

      const ctx = createMockCtx('nestedArray')
      ctx.next = vi.fn().mockReturnValue(mockNestedItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.keyName).toBe('nestedArray')
      expect(result.params).toBe(mockNestedItemAST)
      expect(result.comment).toContain('Array of arrays')
    })

    it('should handle array with items having deep comments', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'string',
          description: 'String item',
        },
        description: 'Array with deep comments',
      }

      const mockItemAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: 'String item comment',
        deepComment: 'Deep comment for string item',
      }

      const ctx = createMockCtx('arrayWithDeepComments')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.deepComment).toContain('[items] start')
      expect(result.deepComment).toContain('String item comment')
      expect(result.deepComment).toContain('Deep comment for string item')
      expect(result.deepComment).toContain('[items] end')
    })

    it('should handle array with title', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        title: 'String List',
        items: {
          type: 'string',
        },
        description: 'A list of strings',
      }

      const mockItemAST: AST = {
        type: ASTType.STRING,
        keyName: '',
      }

      const ctx = createMockCtx('stringList')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.comment).toContain('[title] String List')
      expect(result.comment).toContain('A list of strings')
    })

    it('should handle deprecated array', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'string',
        },
        deprecated: true,
        description: 'A deprecated array',
      }

      const mockItemAST: AST = {
        type: ASTType.STRING,
        keyName: '',
      }

      const ctx = createMockCtx('deprecatedArray')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.deprecated).toBe(true)
    })

    it('should handle array with empty items comment', () => {
      const schema: ArraySchemaObject = {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array with empty item comments',
      }

      const mockItemAST: AST = {
        type: ASTType.STRING,
        keyName: '',
        comment: '',
      }

      const ctx = createMockCtx('arrayWithEmptyComments')
      ctx.next = vi.fn().mockReturnValue(mockItemAST)

      const result = arrayTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ARRAY)
      expect(result.deepComment).toContain('[items] start')
      expect(result.deepComment).toContain('[items] end')
    })
  })
})
