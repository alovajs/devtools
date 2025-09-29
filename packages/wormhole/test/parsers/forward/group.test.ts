import type { SchemaObject } from '@/type'
import groupForwarder from '@/core/loader/astLoader/parsers/forward/group'

describe('group Forwarder', () => {
  describe('is method', () => {
    it('should return true for schema with oneOf', () => {
      const schema: SchemaObject = {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with anyOf', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with allOf', () => {
      const schema: SchemaObject = {
        allOf: [
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
          {
            type: 'object',
            properties: {
              age: { type: 'number' },
            },
          },
        ],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with multiple group types (oneOf and anyOf)', () => {
      const schema: SchemaObject = {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
        ],
        anyOf: [
          { type: 'boolean' },
        ],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with all group types', () => {
      const schema: SchemaObject = {
        oneOf: [{ type: 'string' }],
        anyOf: [{ type: 'number' }],
        allOf: [{ type: 'boolean' }],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with single item in oneOf', () => {
      const schema: SchemaObject = {
        oneOf: [
          { type: 'string' },
        ],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return true for schema with empty arrays in group fields', () => {
      const schema: SchemaObject = {
        oneOf: [],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })

    it('should return false for schema without group fields', () => {
      const schema: SchemaObject = {
        type: 'string',
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for object type schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for array type schema', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for enum schema', () => {
      const schema: SchemaObject = {
        enum: ['value1', 'value2'],
        type: 'string',
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(false)
    })

    it('should return false for empty schema', () => {
      const schema: SchemaObject = {}

      const result = groupForwarder.is(schema)

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
        const result = groupForwarder.is(schema)
        expect(result).toBe(false)
      })
    })

    it('should handle complex nested group schemas', () => {
      const schema: SchemaObject = {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: { enum: ['user'] },
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
          {
            type: 'object',
            properties: {
              type: { enum: ['admin'] },
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        ],
      }

      const result = groupForwarder.is(schema)

      expect(result).toBe(true)
    })
  })

  describe('to property', () => {
    it('should have correct target type', () => {
      expect(groupForwarder.to).toBe('group')
    })
  })
})
