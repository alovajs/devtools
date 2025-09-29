import type { SchemaObject } from '@/type'
import objectForwarder from '@/core/loader/astLoader/parsers/forward/object'

describe('object Forwarder', () => {
  describe('is method', () => {
    it('should return true for schema with type "object"', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with properties field', () => {
      const schema: SchemaObject = {
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with additionalProperties field', () => {
      const schema: SchemaObject = {
        additionalProperties: true,
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with additionalProperties as schema object', () => {
      const schema: SchemaObject = {
        additionalProperties: {
          type: 'string',
        },
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with all object indicators', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return false for schema with additionalProperties as false', () => {
      const schema: SchemaObject = {
        additionalProperties: false,
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for array type schema', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for primitive type schemas', () => {
      const schemas: SchemaObject[] = [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'integer' },
      ]

      schemas.forEach((schema) => {
        const result = objectForwarder.is(schema)
        expect(result).toBe(false)
      })
    })

    it('should return false for empty schema', () => {
      const schema: SchemaObject = {}

      const result = objectForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema with enum', () => {
      const schema: SchemaObject = {
        enum: ['value1', 'value2'],
      }

      const result = objectForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for schema with oneOf/anyOf/allOf', () => {
      const schemas: SchemaObject[] = [
        {
          oneOf: [
            { type: 'string' },
            { type: 'number' },
          ],
        },
        {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
          ],
        },
        {
          allOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { age: { type: 'number' } } },
          ],
        },
      ]

      schemas.forEach((schema) => {
        const result = objectForwarder.is(schema)
        expect(result).toBe(false)
      })
    })
  })

  describe('to property', () => {
    it('should have correct target type', () => {
      expect(objectForwarder.to).toBe('object')
    })
  })
})
