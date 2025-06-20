import { SchemaObject } from '@/type';
import { ParserSchemaType } from '../type';

export interface Forwarder {
  is(schema: SchemaObject): boolean;
  to: ParserSchemaType;
}
