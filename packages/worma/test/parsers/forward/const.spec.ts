import type { SchemaObject } from '@/type'
import forward from '@/core/loader/astLoader/parsers/forward/const'

describe('const forwarder', () => {
  it('should match schema with const string and type string', () => {
    const schema: SchemaObject = {
      type: 'string',
      const: 'email',
    }
    expect(forward.is(schema)).toBe(true)
    expect(forward.to).toBe('const')
  })

  it('should match schema with const number and type number', () => {
    const schema: SchemaObject = {
      type: 'number',
      const: 42,
    }
    expect(forward.is(schema)).toBe(true)
  })

  it('should match schema with const boolean and type boolean', () => {
    const schema: SchemaObject = {
      type: 'boolean',
      const: true,
    }
    expect(forward.is(schema)).toBe(true)
  })

  it('should match schema with const boolean and type boolean (false)', () => {
    const schema: SchemaObject = {
      const: false,
    }
    expect(forward.is(schema)).toBe(true)
  })

  it('should match schema with const value and no explicit type', () => {
    const schema: SchemaObject = {
      const: 'authorization_code',
    }
    expect(forward.is(schema)).toBe(true)
  })

  it('should not match schema with null const', () => {
    const schema: SchemaObject = {
      const: null,
    }
    expect(forward.is(schema)).toBe(false)
  })

  it('should not match schema with no const', () => {
    const schema: SchemaObject = {
      type: 'string',
    }
    expect(forward.is(schema)).toBe(false)
  })

  it('should not match schema with undefined const', () => {
    const schema: SchemaObject = {
      type: 'string',
      const: undefined,
    }
    expect(forward.is(schema)).toBe(false)
  })

  it('should not match empty schema', () => {
    const schema: SchemaObject = {}
    expect(forward.is(schema)).toBe(false)
  })
})
