import type { SchemaObject } from '@/type'
import arrayForwarder from '@/core/loader/astLoader/parsers/forward/array'
import { isMaybeArraySchemaObject } from '@/utils'

// Mock the utility function
vi.mock('@/utils', () => ({
  isMaybeArraySchemaObject: vi.fn(),
}))

describe('array Forwarder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('is method', () => {
    it('should return true for schema with type "array"', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      const result = arrayForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true when isMaybeArraySchemaObject returns true', () => {
      const schema: SchemaObject = {
        items: { type: 'string' },
      }

      ;(isMaybeArraySchemaObject as any).mockReturnValue(true)

      const result = arrayForwarder.is(schema)

      expect(result).toBe(true)
      expect(isMaybeArraySchemaObject).toHaveBeenCalledWith(schema)
    })

    it('should return false when type is not "array" and isMaybeArraySchemaObject returns false', () => {
      const schema: SchemaObject = {
        type: 'string',
      }

      ;(isMaybeArraySchemaObject as any).mockReturnValue(false)

      const result = arrayForwarder.is(schema)

      expect(result).toBe(false)
      expect(isMaybeArraySchemaObject).toHaveBeenCalledWith(schema)
    })

    it('should return true for schema with type "array" even if isMaybeArraySchemaObject returns false', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      ;(isMaybeArraySchemaObject as any).mockReturnValue(false)

      const result = arrayForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return false for empty schema', () => {
      const schema: SchemaObject = {}

      ;(isMaybeArraySchemaObject as any).mockReturnValue(false)

      const result = arrayForwarder.is(schema)

      expect(result).toBe(false)
      expect(isMaybeArraySchemaObject).toHaveBeenCalledWith(schema)
    })

    it('should return false for object type schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      ;(isMaybeArraySchemaObject as any).mockReturnValue(false)

      const result = arrayForwarder.is(schema)

      expect(result).toBe(false)
      expect(isMaybeArraySchemaObject).toHaveBeenCalledWith(schema)
    })

    it('should return false for primitive type schemas', () => {
      const schemas: SchemaObject[] = [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'integer' },
      ]

      ;(isMaybeArraySchemaObject as any).mockReturnValue(false)

      schemas.forEach((schema) => {
        const result = arrayForwarder.is(schema)
        expect(result).toBe(false)
      })

      expect(isMaybeArraySchemaObject).toHaveBeenCalledTimes(schemas.length)
    })
  })

  describe('to property', () => {
    it('should have correct target type', () => {
      expect(arrayForwarder.to).toBe('array')
    })
  })
})
