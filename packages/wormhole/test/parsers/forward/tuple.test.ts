import type { SchemaObject, TupleSchemaObject } from '@/type'
import tupleForwarder from '@/core/loader/astLoader/parsers/forward/tuple'

describe('tuple Forwarder', () => {
  describe('is method', () => {
    it('should return true for array schema with items as array', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
        ],
      }

      const result = tupleForwarder.is(schema as SchemaObject)

      expect(result).toBe(true)
    })

    it('should return true for array schema with single item in items array', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
        ],
      }

      const result = tupleForwarder.is(schema as SchemaObject)

      expect(result).toBe(true)
    })

    it('should return false for array schema with items as object', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for array schema with empty items array', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [],
      }

      const result = tupleForwarder.is(schema as SchemaObject)

      expect(result).toBe(false)
    })

    it('should return false for array schema without items', () => {
      const schema = {
        type: 'array',
      } as SchemaObject

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for non-array type schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for string type schema', () => {
      const schema: SchemaObject = {
        type: 'string',
      }

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema without type field even with items array', () => {
      const schema = {
        items: [
          { type: 'string' },
          { type: 'number' },
        ],
      } as SchemaObject

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for empty schema', () => {
      const schema: SchemaObject = {}

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for array schema with items as null', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: null as any,
      }

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for array schema with items as undefined', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: undefined as any,
      }

      const result = tupleForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should handle complex tuple with nested objects', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
          {
            type: 'array',
            items: { type: 'number' },
          },
          { type: 'boolean' },
        ],
      }

      const result = tupleForwarder.is(schema as SchemaObject)

      expect(result).toBe(true)
    })
  })

  describe('to property', () => {
    it('should have correct target type', () => {
      expect(tupleForwarder.to).toBe('tuple')
    })
  })
})
