import type { ParserSchemaType } from '../type'
import type { SchemaObject } from '@/type'

export interface Forwarder {
  is: (schema: SchemaObject) => boolean
  to: ParserSchemaType
}
