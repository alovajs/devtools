import type { Forwarder } from './type'
import type { SchemaObject } from '@/type'
import arrayForwarder from './array'
import enumForwarder from './enum'
import groupFowarder from './group'
import objectForwarder from './object'
import tupleFowarder from './tuple'

export const forwarders: Forwarder[] = [objectForwarder, enumForwarder, tupleFowarder, arrayForwarder, groupFowarder]
export function forward(schema: SchemaObject) {
  for (const forwarder of forwarders) {
    if (forwarder.is(schema)) {
      return forwarder.to
    }
  }
}
