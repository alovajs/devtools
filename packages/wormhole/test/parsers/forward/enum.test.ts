import type { SchemaObject } from '@/type'
import enumForwarder from '@/core/loader/astLoader/parsers/forward/enum'

describe('enum Forwarder', () => {
  describe('is method', () => {
    it('should return true for schema with string enum values', () => {
      const schema: SchemaObject = {
        enum: ['value1', 'value2', 'value3'],
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with number enum values', () => {
      const schema: SchemaObject = {
        enum: [1, 2, 3],
        type: 'number',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with mixed enum values', () => {
      const schema: SchemaObject = {
        enum: ['string', 123, true, null],
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with single enum value', () => {
      const schema: SchemaObject = {
        enum: ['singleValue'],
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return false for schema with empty enum array', () => {
      const schema: SchemaObject = {
        enum: [],
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema without enum field', () => {
      const schema: SchemaObject = {
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema with null enum field', () => {
      const schema: SchemaObject = {
        enum: null as any,
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema with undefined enum field', () => {
      const schema: SchemaObject = {
        enum: undefined as any,
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema with non-array enum field', () => {
      const schema: SchemaObject = {
        enum: 'not-an-array' as any,
        type: 'string',
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for object type schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for array type schema', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for empty schema', () => {
      const schema: SchemaObject = {}

      const result = enumForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should work without type field when enum is present', () => {
      const schema: SchemaObject = {
        enum: ['value1', 'value2'],
      }

      const result = enumForwarder.is(schema)

      expect(result).toBe(true)
    })
  })

  describe('to property', () => {
    it('should have correct target type', () => {
      expect(enumForwarder.to).toBe('enum')
    })
  })
})
