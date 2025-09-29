import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { SchemaObject, TCustom } from '@/type'
import { simpleTypeParser, stringTypeParser } from '@/core/loader/astLoader/parsers/simple'
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

describe('simple Type Parser', () => {
  const defaultOptions: ParserOptions = {
    commentType: 'doc',
    document: {} as any,
    defaultRequire: false,
  }

  const createMockCtx = (keyName = ''): ParserCtx => ({
    next: vi.fn(),
    keyName,
    pathKey: '',
    visited: new Set(),
    pathMap: new Map(),
    path: ['$'],
    options: defaultOptions,
  })

  describe('simpleTypeParser', () => {
    it('should parse boolean type', () => {
      const schema: SchemaObject = {
        type: 'boolean',
        description: 'A boolean value',
      }
      const ctx = createMockCtx('isActive')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.BOOLEAN)
      expect(result.keyName).toBe('isActive')
      expect(result.comment).toContain('A boolean value')
    })

    it('should parse integer type', () => {
      const schema: SchemaObject = {
        type: 'integer',
        description: 'An integer value',
      }
      const ctx = createMockCtx('count')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.NUMBER)
      expect(result.keyName).toBe('count')
      expect(result.comment).toContain('An integer value')
    })

    it('should parse number type', () => {
      const schema: SchemaObject = {
        type: 'number',
        description: 'A number value',
      }
      const ctx = createMockCtx('price')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.NUMBER)
      expect(result.keyName).toBe('price')
      expect(result.comment).toContain('A number value')
    })

    it('should parse string type', () => {
      const schema: SchemaObject = {
        type: 'string',
        description: 'A string value',
      }
      const ctx = createMockCtx('name')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.STRING)
      expect(result.keyName).toBe('name')
      expect(result.comment).toContain('A string value')
    })

    it('should parse null type', () => {
      const schema: SchemaObject = {
        type: 'null',
        description: 'A null value',
      }
      const ctx = createMockCtx('nullValue')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.NULL)
      expect(result.keyName).toBe('nullValue')
      expect(result.comment).toContain('A null value')
    })

    it('should parse null type when type is null', () => {
      const schema: SchemaObject = {
        type: null as any,
        description: 'A null value',
      }
      const ctx = createMockCtx('nullValue')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.NULL)
      expect(result.keyName).toBe('nullValue')
    })

    it('should handle schema with title', () => {
      const schema: SchemaObject = {
        type: 'string',
        title: 'User Name',
        description: 'The name of the user',
      }
      const ctx = createMockCtx('userName')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.STRING)
      expect(result.keyName).toBe('userName')
      expect(result.comment).toContain('User Name')
      expect(result.comment).toContain('The name of the user')
    })

    it('should handle deprecated schema', () => {
      const schema: SchemaObject = {
        type: 'string',
        deprecated: true,
        description: 'A deprecated string',
      }
      const ctx = createMockCtx('oldField')

      const result = simpleTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.STRING)
      expect(result.deprecated).toBe(true)
    })
  })

  describe('stringTypeParser', () => {
    it('should parse string with binary format as Blob', () => {
      const schema: SchemaObject = {
        type: 'string',
        format: 'binary',
        description: 'A binary file',
      }
      const init = {
        type: ASTType.UNKNOWN,
        keyName: 'file',
        comment: 'A binary file',
        deprecated: false,
      }

      const result = stringTypeParser(schema, init)

      expect(result.type).toBe(ASTType.CUSTOM)
      expect((result as TCustom).params).toBe('Blob')
      expect(result.keyName).toBe('file')
    })

    it('should parse regular string type', () => {
      const schema: SchemaObject = {
        type: 'string',
        description: 'A regular string',
      }
      const init = {
        type: ASTType.UNKNOWN,
        keyName: 'text',
        comment: 'A regular string',
        deprecated: false,
      }

      const result = stringTypeParser(schema, init)

      expect(result.type).toBe(ASTType.STRING)
      expect(result.keyName).toBe('text')
    })

    it('should parse string with other formats as regular string', () => {
      const schema: SchemaObject = {
        type: 'string',
        format: 'date-time',
        description: 'A datetime string',
      }
      const init = {
        type: ASTType.UNKNOWN,
        keyName: 'createdAt',
        comment: 'A datetime string',
        deprecated: false,
      }

      const result = stringTypeParser(schema, init)

      expect(result.type).toBe(ASTType.STRING)
      expect(result.keyName).toBe('createdAt')
    })
  })
})
