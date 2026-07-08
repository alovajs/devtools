import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { SchemaObject, TLiteral } from '@/type'
import { constTypeParser } from '@/core/loader/astLoader/parsers/const'
import { ASTType } from '@/type'

// Mock CommentHelper
vi.mock('@/helper', () => ({
  CommentHelper: {
    load: vi.fn(() => ({
      add: vi.fn().mockReturnThis(),
      end: vi.fn().mockImplementation(function (this: any) {
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

describe('const Type Parser', () => {
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

  it('should parse string const value as LITERAL AST', () => {
    const schema: SchemaObject = {
      type: 'string',
      const: 'email',
      description: 'Channel discriminator',
    }
    const ctx = createMockCtx('channel')

    const result = constTypeParser(schema, ctx)

    expect(result.type).toBe(ASTType.LITERAL)
    expect((result as TLiteral).params).toBe('email')
    expect(result.keyName).toBe('channel')
    expect(result.comment).toContain('Channel discriminator')
  })

  it('should parse number const value as LITERAL AST', () => {
    const schema: SchemaObject = {
      type: 'number',
      const: 1,
    }
    const ctx = createMockCtx('status')

    const result = constTypeParser(schema, ctx)

    expect(result.type).toBe(ASTType.LITERAL)
    expect((result as TLiteral).params).toBe(1)
  })

  it('should parse boolean const value as LITERAL AST', () => {
    const schema: SchemaObject = {
      type: 'boolean',
      const: true,
    }
    const ctx = createMockCtx('active')

    const result = constTypeParser(schema, ctx)

    expect(result.type).toBe(ASTType.LITERAL)
    expect((result as TLiteral).params).toBe(true)
  })

  it('should parse const value without explicit type', () => {
    const schema: SchemaObject = {
      const: 'authorization_code',
    }
    const ctx = createMockCtx('grant_type')

    const result = constTypeParser(schema, ctx)

    expect(result.type).toBe(ASTType.LITERAL)
    expect((result as TLiteral).params).toBe('authorization_code')
  })

  it('should parse object const value as LITERAL AST', () => {
    const schema: SchemaObject = {
      const: { foo: 'bar' },
    }
    const ctx = createMockCtx('config')

    const result = constTypeParser(schema, ctx)

    expect(result.type).toBe(ASTType.LITERAL)
    expect((result as TLiteral).params).toEqual({ foo: 'bar' })
  })

  it('should parse array const value as LITERAL AST', () => {
    const schema: SchemaObject = {
      const: [1, 2, 3],
    }
    const ctx = createMockCtx('numbers')

    const result = constTypeParser(schema, ctx)

    expect(result.type).toBe(ASTType.LITERAL)
    expect((result as TLiteral).params).toEqual([1, 2, 3])
  })
})
