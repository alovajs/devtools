import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { SchemaObject, TEnum, TLiteral } from '@/type'
import { enumTypeParser } from '@/core/loader/astLoader/parsers/enum'
import { logger } from '@/helper'
import { ASTType } from '@/type'

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

describe('enum Type Parser', () => {
  const defaultOptions: ParserOptions = {
    commentType: 'doc',
    document: {} as any,
    defaultRequire: false,
  }

  const createMockCtx = (keyName = ''): ParserCtx => {
    return {
      next: vi.fn(),
      keyName,
      pathKey: '',
      visited: new Set(),
      pathMap: new Map(),
      path: ['$'],
      options: defaultOptions,
    }
  }

  describe('enumTypeParser', () => {
    it('should parse string enum values', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
        description: 'Status enum',
      }

      const ctx = createMockCtx('status')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.keyName).toBe('status')
      expect(result.comment).toContain('Status enum')
      expect(result.params).toHaveLength(3)

      // Check enum values
      expect(result.params[0].keyName).toBe('ACTIVE')
      expect(result.params[0].ast.type).toBe(ASTType.LITERAL)
      expect((result.params[0].ast as TLiteral).params).toBe('active')

      expect(result.params[1].keyName).toBe('INACTIVE')
      expect(result.params[1].ast.type).toBe(ASTType.LITERAL)
      expect((result.params[1].ast as TLiteral).params).toBe('inactive')

      expect(result.params[2].keyName).toBe('PENDING')
      expect(result.params[2].ast.type).toBe(ASTType.LITERAL)
      expect((result.params[2].ast as TLiteral).params).toBe('pending')
    })

    it('should parse number enum values', () => {
      const schema: SchemaObject = {
        type: 'number',
        enum: [1, 2, 3],
        description: 'Priority enum',
      }

      const ctx = createMockCtx('priority')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.keyName).toBe('priority')
      expect(result.comment).toContain('Priority enum')
      expect(result.params).toHaveLength(3)

      // Check enum values
      expect(result.params[0].keyName).toBe('')
      expect(result.params[0].ast.type).toBe(ASTType.LITERAL)
      expect((result.params[0].ast as TLiteral).params).toBe(1)

      expect(result.params[1].keyName).toBe('')
      expect(result.params[1].ast.type).toBe(ASTType.LITERAL)
      expect((result.params[1].ast as TLiteral).params).toBe(2)

      expect(result.params[2].keyName).toBe('')
      expect(result.params[2].ast.type).toBe(ASTType.LITERAL)
      expect((result.params[2].ast as TLiteral).params).toBe(3)
    })

    it('should parse mixed type enum values', () => {
      const schema: SchemaObject = {
        type: ['string', 'number'],
        enum: ['active', 1, 'inactive', 2],
        description: 'Mixed enum',
      }

      const ctx = createMockCtx('mixed')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.params).toHaveLength(4)

      expect(result.params[0].keyName).toBe('ACTIVE')
      expect((result.params[0].ast as TLiteral).params).toBe('active')

      expect(result.params[1].keyName).toBe('')
      expect((result.params[1].ast as TLiteral).params).toBe(1)

      expect(result.params[2].keyName).toBe('INACTIVE')
      expect((result.params[2].ast as TLiteral).params).toBe('inactive')

      expect(result.params[3].keyName).toBe('')
      expect((result.params[3].ast as TLiteral).params).toBe(2)
    })

    it('should handle empty enum array', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: [],
        description: 'Empty enum',
      }

      const ctx = createMockCtx('empty')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.params).toHaveLength(0)
    })

    it('should handle enum without type specified', () => {
      const schema: SchemaObject = {
        enum: ['value1', 'value2'],
        description: 'Enum without type',
      }

      const ctx = createMockCtx('noType')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.params).toHaveLength(2)
      expect((result.params[0].ast as TLiteral).params).toBe('value1')
      expect((result.params[1].ast as TLiteral).params).toBe('value2')
    })

    it('should handle string values that are not valid identifiers', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['123invalid', 'with-dash', 'with space', 'valid_name'],
        description: 'Enum with invalid identifiers',
      }

      const ctx = createMockCtx('invalidIds')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.params).toHaveLength(4)

      // Invalid identifiers should have empty keyName
      expect(result.params[0].keyName).toBe('')
      expect((result.params[0].ast as TLiteral).params).toBe('123invalid')

      expect(result.params[1].keyName).toBe('')
      expect((result.params[1].ast as TLiteral).params).toBe('with-dash')

      expect(result.params[2].keyName).toBe('')
      expect((result.params[2].ast as TLiteral).params).toBe('with space')

      // Valid identifier should have uppercase keyName
      expect(result.params[3].keyName).toBe('VALID_NAME')
      expect((result.params[3].ast as TLiteral).params).toBe('valid_name')
    })

    it('should handle enum with title', () => {
      const schema: SchemaObject = {
        type: 'string',
        title: 'Status Type',
        enum: ['active', 'inactive'],
        description: 'Status enumeration',
      }

      const ctx = createMockCtx('statusType')

      const result = enumTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.comment).toContain('[title] Status Type')
      expect(result.comment).toContain('Status enumeration')
    })

    it('should handle deprecated enum', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['old', 'legacy'],
        deprecated: true,
        description: 'Deprecated enum',
      }

      const ctx = createMockCtx('deprecated')

      const result = enumTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.deprecated).toBe(true)
    })

    it('should throw error when enum values do not match type', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['valid', 123, 'another'],
        title: 'Invalid Enum',
        description: 'Enum with type mismatch',
      }

      const ctx = createMockCtx('invalid')

      expect(() => {
        enumTypeParser(schema, ctx)
      }).toThrow()

      expect(logger.throwError).toHaveBeenCalledWith(
        'enum Invalid Enum type error',
        {
          enum: ['valid', 123, 'another'],
          type: ['string'],
        },
      )
    })

    it('should throw error when enum values do not match multiple types', () => {
      const schema: SchemaObject = {
        type: ['string', 'number'],
        enum: ['valid', 123, true], // boolean is not allowed
        title: 'Multi Type Enum',
        description: 'Enum with multiple types but invalid value',
      }

      const ctx = createMockCtx('multiType')

      expect(() => {
        enumTypeParser(schema, ctx)
      }).toThrow()

      expect(logger.throwError).toHaveBeenCalledWith(
        'enum Multi Type Enum type error',
        {
          enum: ['valid', 123, true],
          type: ['string', 'number'],
        },
      )
    })

    it('should handle boolean enum values', () => {
      const schema: SchemaObject = {
        type: 'boolean',
        enum: [true, false],
        description: 'Boolean enum',
      }

      const ctx = createMockCtx('boolEnum')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.params).toHaveLength(2)

      expect(result.params[0].keyName).toBe('')
      expect((result.params[0].ast as TLiteral).params).toBe(true)

      expect(result.params[1].keyName).toBe('')
      expect((result.params[1].ast as TLiteral).params).toBe(false)
    })

    it('should handle null enum values', () => {
      const schema: SchemaObject = {
        type: 'null',
        enum: [null],
        description: 'Null enum',
      }

      const ctx = createMockCtx('nullEnum')

      const result = enumTypeParser(schema, ctx) as TEnum

      expect(result.type).toBe(ASTType.ENUM)
      expect(result.params).toHaveLength(1)

      expect(result.params[0].keyName).toBe('')
      expect((result.params[0].ast as TLiteral).params).toBe(null)
    })
  })
})
