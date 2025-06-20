import { SchemaObject } from '@/type';
import arrayForwarder from './array';
import enumForwarder from './enum';
import groupFowarder from './group';
import objectForwarder from './object';
import tupleFowarder from './tuple';
import { Forwarder } from './type';

export const forwarders: Forwarder[] = [objectForwarder, enumForwarder, arrayForwarder, tupleFowarder, groupFowarder];
export const forward = (schema: SchemaObject) => {
  for (const forwarder of forwarders) {
    if (forwarder.is(schema)) {
      return forwarder.to;
    }
  }
};
