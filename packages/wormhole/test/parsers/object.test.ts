import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { AST, SchemaObject, TInterface } from '@/type'
import { objectTypeParser } from '@/core/loader/astLoader/parsers/object'
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

describe('object Type Parser', () => {
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

  describe('objectTypeParser', () => {
    it('should parse object with properties as interface', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'User ID',
          },
          name: {
            type: 'string',
            description: 'User name',
          },
        },
        required: ['id'],
        description: 'User object',
      }

      const mockIdAST: AST = {
        type: ASTType.NUMBER,
        keyName: 'id',
        comment: 'User ID',
      }

      const mockNameAST: AST = {
        type: ASTType.STRING,
        keyName: 'name',
        comment: 'User name',
      }

      const ctx = createMockCtx('user')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockIdAST)
        .mockReturnValueOnce(mockNameAST)

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.keyName).toBe('user')
      expect(result.comment).toContain('User object')
      expect(result.params).toHaveLength(2)

      // Check first property (id)
      expect(result.params[0].ast).toBe(mockIdAST)
      expect(result.params[0].keyName).toBe('id')
      expect(result.params[0].isRequired).toBe(true)

      // Check second property (name)
      expect(result.params[1].ast).toBe(mockNameAST)
      expect(result.params[1].keyName).toBe('name')
      expect(result.params[1].isRequired).toBe(false)

      expect(ctx.next).toHaveBeenCalledTimes(2)
    })

    it('should parse empty object without properties as object type', () => {
      const schema: SchemaObject = {
        type: 'object',
        description: 'Empty object',
      }

      const ctx = createMockCtx('emptyObj')

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.OBJECT)
      expect(result.keyName).toBe('emptyObj')
      expect(result.comment).toContain('Empty object')
      expect(result.params).toHaveLength(0)
    })

    it('should handle object with all required properties when defaultRequire is true', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        description: 'Object with default required',
      }

      const mockIdAST: AST = { type: ASTType.NUMBER, keyName: 'id' }
      const mockNameAST: AST = { type: ASTType.STRING, keyName: 'name' }

      const ctx = createMockCtx('requiredObj')
      ctx.options = { ...defaultOptions, defaultRequire: true }
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockIdAST)
        .mockReturnValueOnce(mockNameAST)

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.params[0].isRequired).toBe(true)
      expect(result.params[1].isRequired).toBe(true)
    })

    it('should handle object with additionalProperties as boolean', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: true,
        description: 'Object with additional properties',
      }

      const mockNameAST: AST = { type: ASTType.STRING, keyName: 'name' }

      const ctx = createMockCtx('flexibleObj')
      ctx.next = vi.fn().mockReturnValue(mockNameAST)

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.addParams).toEqual({ type: ASTType.ANY })
    })

    it('should handle object with additionalProperties as schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: {
          type: 'number',
          description: 'Additional number properties',
        },
        description: 'Object with typed additional properties',
      }

      const mockNameAST: AST = { type: ASTType.STRING, keyName: 'name' }
      const mockAdditionalAST: AST = {
        type: ASTType.NUMBER,
        keyName: '[key: string]',
        comment: 'Additional number properties',
      }

      const ctx = createMockCtx('typedFlexibleObj')
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockNameAST)
        .mockReturnValueOnce(mockAdditionalAST)

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.addParams).toBe(mockAdditionalAST)
      expect(ctx.pathKey).toBe('[key: string]')
    })

    it('should handle object with no properties but with additionalProperties', () => {
      const schema: SchemaObject = {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
        description: 'Object with only additional properties',
      }

      const mockAdditionalAST: AST = { type: ASTType.STRING, keyName: '[key: string]' }

      const ctx = createMockCtx('additionalOnlyObj')
      ctx.next = vi.fn().mockReturnValue(mockAdditionalAST)

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.params).toHaveLength(0)
      expect(result.addParams).toBe(mockAdditionalAST)
    })

    it('should handle nested objects', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
            required: ['id'],
          },
        },
        description: 'Object with nested object',
      }

      const mockNestedUserAST: AST = {
        type: ASTType.INTERFACE,
        keyName: 'user',
        params: [
          { ast: { type: ASTType.NUMBER, keyName: 'id' }, keyName: 'id', isRequired: true },
          { ast: { type: ASTType.STRING, keyName: 'name' }, keyName: 'name', isRequired: false },
        ],
      }

      const ctx = createMockCtx('nestedObj')
      ctx.next = vi.fn().mockReturnValue(mockNestedUserAST)

      const result = objectTypeParser(schema, ctx) as TInterface

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.params).toHaveLength(1)
      expect(result.params[0].ast).toBe(mockNestedUserAST)
      expect(result.params[0].keyName).toBe('user')
    })

    it('should handle object with title', () => {
      const schema: SchemaObject = {
        type: 'object',
        title: 'User Model',
        properties: {
          id: { type: 'number' },
        },
        description: 'A user model',
      }

      const mockIdAST: AST = { type: ASTType.NUMBER, keyName: 'id' }

      const ctx = createMockCtx('userModel')
      ctx.next = vi.fn().mockReturnValue(mockIdAST)

      const result = objectTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.comment).toContain('[title] User Model')
      expect(result.comment).toContain('A user model')
    })

    it('should handle deprecated object', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        deprecated: true,
        description: 'A deprecated object',
      }

      const mockIdAST: AST = { type: ASTType.NUMBER, keyName: 'id' }

      const ctx = createMockCtx('deprecatedObj')
      ctx.next = vi.fn().mockReturnValue(mockIdAST)

      const result = objectTypeParser(schema, ctx)

      expect(result.type).toBe(ASTType.INTERFACE)
      expect(result.deprecated).toBe(true)
    })

    it('should set pathKey correctly for each property', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      }

      const ctx = createMockCtx('nameObj')
      ctx.next = vi.fn().mockReturnValue({ type: ASTType.STRING, keyName: '' })

      objectTypeParser(schema, ctx)

      expect(ctx.next).toHaveBeenNthCalledWith(1, schema.properties?.firstName, ctx.options)
      expect(ctx.next).toHaveBeenNthCalledWith(2, schema.properties?.lastName, ctx.options)
    })
  })
})
