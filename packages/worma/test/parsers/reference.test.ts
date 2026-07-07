import type { ParserCtx, ParserOptions } from '@/core/loader/astLoader/parsers/type'
import type { AST, OpenAPIDocument, ReferenceObject, SchemaObject, TReference } from '@/type'
import normalizer from '@/core/loader/astLoader/normalize'
import { referenceTypeParser } from '@/core/loader/astLoader/parsers/reference'
import { standardLoader } from '@/core/loader/standardLoader'
import { CommentHelper } from '@/helper'
import { ASTType } from '@/type'
import { dereference } from '@/utils'

// Mock dependencies
vi.mock('@/core/loader/standardLoader', () => ({
  standardLoader: {
    transformRefName: vi.fn((ref: string) => {
      // Extract the last part of the reference path
      return ref.split('/').pop() || 'UnknownRef'
    }),
  },
}))

vi.mock('@/helper', () => ({
  CommentHelper: {
    load: vi.fn(() => ({
      add: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnValue('[cycle] Circular reference detected'),
    })),
  },
}))

vi.mock('@/utils', () => ({
  dereference: vi.fn(),
  isReferenceObject: vi.fn((obj: any) => !!obj?.$ref),
}))

vi.mock('@/core/loader/astLoader/normalize', () => ({
  default: {
    normalize: vi.fn((schema: any) => schema),
  },
}))

describe('reference Type Parser', () => {
  const mockDocument: OpenAPIDocument = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          description: 'User schema',
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
          },
          description: 'Product schema',
        },
      },
    },
  }

  const defaultOptions: ParserOptions = {
    commentType: 'doc',
    document: mockDocument,
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('referenceTypeParser', () => {
    it('should parse reference and return resolved schema', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/User',
      }

      const resolvedSchema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        description: 'User schema',
      }

      const mockResolvedAST: AST = {
        type: ASTType.INTERFACE,
        keyName: 'User',
        comment: 'User schema',
        params: [
          { ast: { type: ASTType.NUMBER, keyName: 'id' }, keyName: 'id', isRequired: false },
          { ast: { type: ASTType.STRING, keyName: 'name' }, keyName: 'name', isRequired: false },
        ],
      }

      const ctx = createMockCtx()
      ctx.next = vi.fn().mockReturnValue(mockResolvedAST)

      // Mock dereference to return the resolved schema
      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('User')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockResolvedAST)
      expect(standardLoader.transformRefName).toHaveBeenCalledWith('#/components/schemas/User')
      expect(dereference).toHaveBeenCalledWith(schema, mockDocument)
      expect(normalizer.normalize).toHaveBeenCalledWith(resolvedSchema)
      expect(ctx.next).toHaveBeenCalledWith(resolvedSchema, ctx.options)
      expect(ctx.keyName).toBe('User')
      expect(ctx.visited.has('#/components/schemas/User')).toBe(false) // Should be cleaned up
    })

    it('should detect circular references and return reference AST', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/CircularRef',
      }

      const ctx = createMockCtx()
      ctx.visited.add('#/components/schemas/CircularRef')
      ctx.pathMap.set('#/components/schemas/CircularRef', '$.components.schemas.CircularRef')

      ;(standardLoader.transformRefName as any).mockReturnValue('CircularRef')

      const result = referenceTypeParser(schema, ctx) as TReference

      expect(result.type).toBe(ASTType.REFERENCE)
      expect(result.keyName).toBe('')
      expect(result.params).toBe('CircularRef')
      expect(result.deepComment).toBe('[cycle] Circular reference detected')
      expect(CommentHelper.load).toHaveBeenCalledWith({ type: 'doc' })
      expect(ctx.next).not.toHaveBeenCalled()
    })

    it('should handle reference with onReference callback', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/Product',
      }

      const resolvedSchema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
        },
        description: 'Product schema',
      }

      const mockResolvedAST: AST = {
        type: ASTType.INTERFACE,
        keyName: 'Product',
        comment: 'Product schema',
        params: [
          { ast: { type: ASTType.NUMBER, keyName: 'id' }, keyName: 'id', isRequired: false },
          { ast: { type: ASTType.STRING, keyName: 'title' }, keyName: 'title', isRequired: false },
        ],
      }

      const onReferenceMock = vi.fn()
      const ctx = createMockCtx()
      ctx.options = { ...defaultOptions, onReference: onReferenceMock }
      ctx.next = vi.fn().mockReturnValue(mockResolvedAST)

      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('Product')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockResolvedAST)
      expect(onReferenceMock).toHaveBeenCalledWith(mockResolvedAST)
    })

    it('should handle nested references', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/NestedRef',
      }

      const resolvedSchema: SchemaObject = {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
        },
        description: 'Schema with nested reference',
      }

      const mockNestedAST: AST = {
        type: ASTType.INTERFACE,
        keyName: 'NestedRef',
        comment: 'Schema with nested reference',
        params: [
          {
            ast: {
              type: ASTType.REFERENCE,
              keyName: 'user',
              params: 'User',
            },
            keyName: 'user',
            isRequired: false,
          },
        ],
      }

      const ctx = createMockCtx()
      ctx.next = vi.fn().mockReturnValue(mockNestedAST)

      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('NestedRef')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockNestedAST)
      expect(ctx.keyName).toBe('NestedRef')
    })

    it('should handle reference to primitive type', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/StringType',
      }

      const resolvedSchema: SchemaObject = {
        type: 'string',
        description: 'A string type',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: 'StringType',
        comment: 'A string type',
      }

      const ctx = createMockCtx()
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('StringType')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockStringAST)
      expect(ctx.keyName).toBe('StringType')
    })

    it('should handle reference to array type', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/UserArray',
      }

      const resolvedSchema: SchemaObject = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/User',
        },
        description: 'Array of users',
      }

      const mockArrayAST: AST = {
        type: ASTType.ARRAY,
        keyName: 'UserArray',
        comment: 'Array of users',
        params: {
          type: ASTType.REFERENCE,
          keyName: '',
          params: 'User',
        },
      }

      const ctx = createMockCtx()
      ctx.next = vi.fn().mockReturnValue(mockArrayAST)

      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('UserArray')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockArrayAST)
      expect(ctx.keyName).toBe('UserArray')
    })

    it('should manage visited set correctly for multiple references', () => {
      const schema1: ReferenceObject = {
        $ref: '#/components/schemas/FirstRef',
      }

      const schema2: ReferenceObject = {
        $ref: '#/components/schemas/SecondRef',
      }

      const resolvedSchema1: SchemaObject = {
        type: 'string',
        description: 'First reference',
      }

      const resolvedSchema2: SchemaObject = {
        type: 'number',
        description: 'Second reference',
      }

      const mockAST1: AST = {
        type: ASTType.STRING,
        keyName: 'FirstRef',
        comment: 'First reference',
      }

      const mockAST2: AST = {
        type: ASTType.NUMBER,
        keyName: 'SecondRef',
        comment: 'Second reference',
      }

      const ctx = createMockCtx()
      ctx.next = vi.fn()
        .mockReturnValueOnce(mockAST1)
        .mockReturnValueOnce(mockAST2)

      ;(dereference as any)
        .mockReturnValueOnce(resolvedSchema1)
        .mockReturnValueOnce(resolvedSchema2)
      ;(normalizer.normalize as any)
        .mockReturnValueOnce(resolvedSchema1)
        .mockReturnValueOnce(resolvedSchema2)
      ;(standardLoader.transformRefName as any)
        .mockReturnValueOnce('FirstRef')
        .mockReturnValueOnce('SecondRef')

      // Parse first reference
      const result1 = referenceTypeParser(schema1, ctx)
      expect(result1).toBe(mockAST1)
      expect(ctx.visited.has('#/components/schemas/FirstRef')).toBe(false)

      // Parse second reference
      const result2 = referenceTypeParser(schema2, ctx)
      expect(result2).toBe(mockAST2)
      expect(ctx.visited.has('#/components/schemas/SecondRef')).toBe(false)
    })

    it('should handle reference with complex path', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/deeply/nested/Reference',
      }

      const resolvedSchema: SchemaObject = {
        type: 'boolean',
        description: 'Deeply nested reference',
      }

      const mockBooleanAST: AST = {
        type: ASTType.BOOLEAN,
        keyName: 'Reference',
        comment: 'Deeply nested reference',
      }

      const ctx = createMockCtx()
      ctx.next = vi.fn().mockReturnValue(mockBooleanAST)

      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('Reference')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockBooleanAST)
      expect(standardLoader.transformRefName).toHaveBeenCalledWith('#/components/schemas/deeply/nested/Reference')
    })

    it('should handle reference without onReference callback', () => {
      const schema: ReferenceObject = {
        $ref: '#/components/schemas/SimpleRef',
      }

      const resolvedSchema: SchemaObject = {
        type: 'string',
        description: 'Simple reference',
      }

      const mockStringAST: AST = {
        type: ASTType.STRING,
        keyName: 'SimpleRef',
        comment: 'Simple reference',
      }

      const ctx = createMockCtx()
      ctx.options = { ...defaultOptions, onReference: undefined }
      ctx.next = vi.fn().mockReturnValue(mockStringAST)

      ;(dereference as any).mockReturnValue(resolvedSchema)
      ;(normalizer.normalize as any).mockReturnValue(resolvedSchema)
      ;(standardLoader.transformRefName as any).mockReturnValue('SimpleRef')

      const result = referenceTypeParser(schema, ctx)

      expect(result).toBe(mockStringAST)
      // Should not throw error when onReference is undefined
    })
  })
})
