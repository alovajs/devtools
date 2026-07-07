import type { SchemaObject } from '@/type'
import { astGenerate, getValue } from '@/core/loader/astLoader/generates'
import normalizer from '@/core/loader/astLoader/normalize'
import { astParse } from '@/core/loader/astLoader/parsers'

// (issue #824)
describe('const handling in normalized schemas', () => {
  it('should preserve const value in normalized schema with type string', () => {
    const schema: SchemaObject = {
      type: 'string',
      const: 'email',
    }
    const result = normalizer.normalize(schema) as SchemaObject
    expect(result.const).toBe('email')
    expect(result.type).toBe('string')
  })

  it('should preserve const value in normalized schema with no type', () => {
    const schema: SchemaObject = {
      const: 'authorization_code',
    }
    const result = normalizer.normalize(schema) as SchemaObject
    expect(result.const).toBe('authorization_code')
  })

  it('should generate literal type for a property with const string', async () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        channel: { type: 'string', const: 'email' },
        email: { type: 'string' },
      },
      required: ['channel', 'email'],
    }
    const ast = astParse(schema, {
      commentType: 'line',
      document: {} as any,
    })
    const result = await astGenerate(ast, { commentType: 'line' })
    expect(getValue(result, { commentType: 'line' })).toContain(`channel:"email"`)
  })

  it('should generate discriminated union when oneOf branches differ only by const discriminator', async () => {
    const schema: SchemaObject = {
      oneOf: [
        {
          type: 'object',
          properties: {
            channel: { type: 'string', const: 'email' },
            email: { type: 'string' },
          },
          required: ['channel', 'email'],
        },
        {
          type: 'object',
          properties: {
            channel: { type: 'string', const: 'phone' },
            phone: { type: 'string' },
          },
          required: ['channel', 'phone'],
        },
      ],
    }
    const ast = astParse(schema, {
      commentType: 'line',
      document: {} as any,
    })
    const result = await astGenerate(ast, { commentType: 'line' })
    const out = getValue(result, { commentType: 'line' })
    expect(out).toContain(`channel:"email"`)
    expect(out).toContain(`channel:"phone"`)
    expect(out).toMatch(/\}\s*\)\s*\|\s*\(\{[\s\S]*channel:"phone"/)
  })

  it('should generate literal type for a const-only schema (no type)', async () => {
    const schema: SchemaObject = {
      const: 'authorization_code',
    }
    const ast = astParse(schema, {
      commentType: 'line',
      document: {} as any,
    })
    const result = await astGenerate(ast, { commentType: 'line' })
    expect(getValue(result, { commentType: 'line' })).toContain(`"authorization_code"`)
  })

  it('should generate literal type for a const number', async () => {
    const schema: SchemaObject = {
      type: 'number',
      const: 1,
    }
    const ast = astParse(schema, {
      commentType: 'line',
      document: {} as any,
    })
    const result = await astGenerate(ast, { commentType: 'line' })
    expect(getValue(result, { commentType: 'line' })).toContain(`1`)
  })

  it('should generate literal type for a const boolean', async () => {
    const schema: SchemaObject = {
      type: 'boolean',
      const: true,
    }
    const ast = astParse(schema, {
      commentType: 'line',
      document: {} as any,
    })
    const result = await astGenerate(ast, { commentType: 'line' })
    expect(getValue(result, { commentType: 'line' })).toContain(`true`)
  })
})
