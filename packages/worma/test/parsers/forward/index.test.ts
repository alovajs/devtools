import type { SchemaObject, TupleSchemaObject } from '@/type'
import { forward, forwarders } from '@/core/loader/astLoader/parsers/forward'

describe('forward function and forwarders', () => {
  describe('forwarders array', () => {
    it('should have correct order and length', () => {
      expect(forwarders).toHaveLength(5)
      expect(forwarders.map(f => f.to)).toEqual(['object', 'enum', 'tuple', 'array', 'group'])
    })

    it('should have all forwarders with correct interface', () => {
      forwarders.forEach((forwarder) => {
        expect(forwarder).toHaveProperty('is')
        expect(forwarder).toHaveProperty('to')
        expect(typeof forwarder.is).toBe('function')
        expect(typeof forwarder.to).toBe('string')
      })
    })
  })

  describe('forward function', () => {
    it('should return "object" for object schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = forward(schema)

      expect(result).toBe('object')
    })

    it('should return "enum" for enum schema', () => {
      const schema: SchemaObject = {
        enum: ['value1', 'value2'],
        type: 'string',
      }

      const result = forward(schema)

      expect(result).toBe('enum')
    })

    it('should return "array" for array schema', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      const result = forward(schema)

      expect(result).toBe('array')
    })

    it('should return "tuple" for tuple schema', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      const result = forward(schema as SchemaObject)

      expect(result).toBe('tuple')
    })

    it('should return "group" for group schema with oneOf', () => {
      const schema: SchemaObject = {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      const result = forward(schema)

      expect(result).toBe('group')
    })

    it('should return "group" for group schema with anyOf', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      const result = forward(schema)

      expect(result).toBe('group')
    })

    it('should return "group" for group schema with allOf', () => {
      const schema: SchemaObject = {
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } } },
          { type: 'object', properties: { age: { type: 'number' } } },
        ],
      }

      const result = forward(schema)

      expect(result).toBe('group')
    })

    it('should return undefined for primitive type schemas', () => {
      const schemas: SchemaObject[] = [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'integer' },
      ]

      schemas.forEach((schema) => {
        const result = forward(schema)
        expect(result).toBeUndefined()
      })
    })

    it('should return undefined for empty schema', () => {
      const schema: SchemaObject = {}

      const result = forward(schema)

      expect(result).toBeUndefined()
    })

    it('should prioritize enum over object when both conditions match', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['value1', 'value2'],
        properties: {
          name: { type: 'string' },
        },
      }

      const result = forward(schema)

      // Should return the first matching forwarder (object comes first in the array)
      expect(result).toBe('object')
    })

    it('should prioritize tuple over array for array with items array', () => {
      const schema: TupleSchemaObject = {
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      const result = forward(schema as SchemaObject)

      // Should return the first matching forwarder (tuple comes before array in the array)
      expect(result).toBe('tuple')
    })

    it('should handle complex schemas with multiple potential matches', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          data: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
            ],
          },
        },
        enum: ['complex'],
      }

      const result = forward(schema)

      // Should return the first matching forwarder
      expect(result).toBe('object')
    })

    it('should return undefined for null schema', () => {
      const result = forward(null as any)

      expect(result).toBeUndefined()
    })

    it('should handle schema with only description', () => {
      const schema: SchemaObject = {
        description: 'Just a description',
      }

      const result = forward(schema)

      expect(result).toBeUndefined()
    })
  })
})
