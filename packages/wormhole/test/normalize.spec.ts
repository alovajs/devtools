import normalizer from '@/core/loader/astLoader/normalize';
import type { ArraySchemaObject, SchemaObject } from '@/type';

describe('Schema Normalizer', () => {
  describe('validateSchema rule', () => {
    it('should fix invalid type field', () => {
      const schema: SchemaObject = {
        type: {} as any, // 无效的类型
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('null');
      expect(result.title).toBe('Test');
    });

    it('should remove invalid enum field', () => {
      const schema: SchemaObject = {
        enum: 'invalid' as any, // 无效的枚举
        type: 'string'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.enum).toBeUndefined();
      expect(result.type).toBe('string');
    });

    it('should handle null const value', () => {
      const schema: SchemaObject = {
        const: null,
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('null');
      expect(result.const).toBe(null);
    });
  });

  describe('normalizeNullType rule', () => {
    it('should convert type: null to type: "null"', () => {
      const schema: SchemaObject = {
        type: null as any,
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('null');
    });

    it('should handle union types with null', () => {
      const schema: SchemaObject = {
        type: ['string', null as any, 'number'],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBeUndefined();
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(3);
      expect((result.anyOf![0] as SchemaObject).type).toBe('string');
      expect((result.anyOf![1] as SchemaObject).type).toBe('number');
      expect((result.anyOf![2] as SchemaObject).type).toBe('null');
    });

    it('should handle array with only null', () => {
      const schema: SchemaObject = {
        type: [null as any],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('null');
    });
  });

  describe('simplifySingleType rule', () => {
    it('should simplify single element type array', () => {
      const schema: SchemaObject = {
        type: ['string'],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('string');
    });
  });

  describe('convertTypeArray rule', () => {
    it('should convert type array to anyOf structure', () => {
      const schema: SchemaObject = {
        type: ['string', 'number'],
        minLength: 5,
        minimum: 0,
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBeUndefined();
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(2);
      expect(result.title).toBe('Test');

      const stringBranch = result.anyOf![0] as SchemaObject;
      const numberBranch = result.anyOf![1] as SchemaObject;

      expect(stringBranch.type).toBe('string');
      expect(stringBranch.minLength).toBe(5);
      expect(stringBranch.minimum).toBeUndefined();

      expect(numberBranch.type).toBe('number');
      expect(numberBranch.minimum).toBe(0);
      expect(numberBranch.minLength).toBeUndefined();
    });

    it('should handle unknown types by preserving all keywords', () => {
      const schema: SchemaObject = {
        type: ['unknown' as any],
        minLength: 5,
        minimum: 0,
        title: 'Test'
      };
      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(2);
      const branch1 = result.anyOf![0] as SchemaObject;
      const branch2 = result.anyOf![1] as SchemaObject;
      expect(typeof branch1.type).toBe('string');
      expect(typeof branch2.type).toBe('string');
      expect(branch1.type).not.toBe(branch2.type);
      expect(['string', 'number'].includes(branch1.type as string)).toBe(true);
      expect(['string', 'number'].includes(branch2.type as string)).toBe(true);
      const stringBranch = branch1.type === 'string' ? branch1 : branch2;
      const numberBranch = branch1.type === 'number' ? branch1 : branch2;
      expect(stringBranch.type).toBe('string');
      expect(stringBranch.minLength).toBe(5);
      expect(stringBranch.minimum).toBeUndefined();
      expect(numberBranch.type).toBe('number');
      expect(numberBranch.minLength).toBeUndefined();
      expect(numberBranch.minimum).toBe(0);
    });

    it('should handle array type with items keyword', () => {
      const schema: SchemaObject = {
        type: ['array', 'string'],
        items: { type: 'string' },
        minLength: 5,
        minItems: 1,
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(2);

      const arrayBranch = result.anyOf![0] as ArraySchemaObject;
      const stringBranch = result.anyOf![1] as SchemaObject;

      expect(arrayBranch.type).toBe('array');
      expect(arrayBranch.items).toBeDefined();
      expect(arrayBranch.minItems).toBe(1);
      expect(arrayBranch.minLength).toBeUndefined();

      expect(stringBranch.type).toBe('string');
      expect(stringBranch.minLength).toBe(5);
      expect((stringBranch as ArraySchemaObject).items).toBeUndefined();
    });
  });

  describe('mergeAnyOf rule', () => {
    it('should merge anyOf with same types', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'number', minimum: 0 },
          { type: 'string', minLength: 5 },
          { type: 'string', maxLength: 10 }
        ],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.anyOf).toHaveLength(2);
      expect(result.title).toBe('Test');
      const numberBranch = result.anyOf![0] as SchemaObject;
      const stringBranch = result.anyOf![1] as SchemaObject;
      expect(stringBranch.type).toBe('string');
      expect(stringBranch.minLength).toBe(5);
      expect(stringBranch.maxLength).toBe(10);
      expect(numberBranch.type).toBe('number');
      expect(numberBranch.minimum).toBe(0);
    });

    it('should not merge anyOf with different types', () => {
      const schema: SchemaObject = {
        anyOf: [
          { type: 'string', minLength: 5 },
          { type: 'number', minimum: 0 }
        ],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(2);
    });
  });

  describe('normalizeEnum rule', () => {
    it('should infer type from enum values', () => {
      const schema: SchemaObject = {
        enum: ['a', 'b', 'c'],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('string');
      expect(result.enum).toEqual(['a', 'b', 'c']);
    });

    it('should handle mixed enum types', () => {
      const schema: SchemaObject = {
        enum: ['a', 1, true],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toEqual(['string', 'integer', 'boolean']); // 不应该推断类型
      expect(result.enum).toEqual(['a', 1, true]);
    });
  });

  describe('inferType rule', () => {
    it('should infer object type from properties', () => {
      const schema: SchemaObject = {
        properties: {
          name: { type: 'string' }
        },
        required: ['name'],
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('object');
    });

    it('should infer array type from items', () => {
      const schema: SchemaObject = {
        items: { type: 'string' },
        minItems: 1,
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('array');
    });

    it('should infer string type from string keywords', () => {
      const schema: SchemaObject = {
        minLength: 5,
        maxLength: 10,
        pattern: '^[a-z]+$',
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('string');
    });

    it('should infer number type from number keywords', () => {
      const schema: SchemaObject = {
        minimum: 0,
        maximum: 100,
        multipleOf: 5,
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('number');
    });
  });

  describe('removeRedundantKeywords rule', () => {
    it('should remove keywords not matching the type', () => {
      const schema: SchemaObject = {
        type: 'string',
        minLength: 5,
        minimum: 0, // 不适用于字符串
        minItems: 1, // 不适用于字符串
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.minLength).toBe(5);
      expect(result.minimum).toBeUndefined();
      expect(result.minItems).toBeUndefined();
    });
  });

  describe('handleEmptyType rule', () => {
    it('should set type to null when no type information', () => {
      const schema: SchemaObject = {
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('null');
    });
  });

  describe('complex scenarios', () => {
    it('should handle nested schemas', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          items: {
            type: ['string', 'number'],
            minLength: 5,
            minimum: 0
          }
        },
        title: 'Test'
      };

      const result = normalizer.normalize(schema) as SchemaObject;
      expect(result.type).toBe('object');
      expect(result.properties!.items).toBeDefined();

      const itemsSchema = result.properties!.items as SchemaObject;
      expect(itemsSchema.anyOf).toBeDefined();
      expect(itemsSchema.anyOf).toHaveLength(2);
    });

    it('should handle array of schemas', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: {
          type: ['string', null as any],
          minLength: 5
        }
      };

      const result = normalizer.normalize(schema) as ArraySchemaObject;
      expect(result.type).toBe('array');
      expect(result.items).toBeDefined();

      const itemsSchema = result.items as SchemaObject;
      expect(itemsSchema.anyOf).toBeDefined();
      expect(itemsSchema.anyOf).toHaveLength(2);
      expect((itemsSchema.anyOf![0] as SchemaObject).type).toBe('string');
      expect((itemsSchema.anyOf![1] as SchemaObject).type).toBe('null');
    });
  });
});
