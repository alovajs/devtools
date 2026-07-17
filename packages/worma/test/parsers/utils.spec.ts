import type { MaybeSchemaObject, SchemaObject } from '@/type'
import { getParserSchemaType } from '@/core/loader/astLoader/parsers/utils'

describe('getParserSchemaType', () => {
  it('should resolve a primitive schema to its type', () => {
    const schema: SchemaObject = { type: 'string' }
    expect(getParserSchemaType(schema)).toBe('string')
  })

  it('should resolve a $ref schema to reference', () => {
    expect(getParserSchemaType({ $ref: '#/components/schemas/Foo' })).toBe('reference')
  })

  it('should return null for an array whose items are undefined', () => {
    // An `array` schema without `items` yields `undefined` when its item is parsed.
    expect(getParserSchemaType(undefined as unknown as MaybeSchemaObject)).toBe('null')
  })
})
