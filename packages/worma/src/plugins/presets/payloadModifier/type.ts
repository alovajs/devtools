export type ModifierScope = 'params' | 'pathParams' | 'data' | 'response'

export type SchemaPrimitive = 'number' | 'string' | 'boolean' | 'undefined' | 'null' | 'unknown' | 'any' | 'never'

/**
 * Array type: a native JS array whose elements are Schemas.
 * e.g. ['string'] means string[]; ['string', 'number'] means the tuple [string, number]
 */
export type SchemaArray = Schema[]

/**
 * Object/reference type.
 * Required properties are written directly; optional properties are wrapped
 * with the `SchemaOptional` form `{ required: false, type: Schema }`
 * (consistent with how a standalone optional primitive is represented).
 */
export interface SchemaReference {
  [attr: string]: Schema
}

/**
 * Enum type representation.
 */
export interface SchemaEnum {
  enum: Array<string | number | boolean | null>
  type?: SchemaPrimitive
}

/**
 * Composite types (oneOf / anyOf / allOf).
 */
export interface SchemaOneOf { oneOf: Schema[] }
export interface SchemaAnyOf { anyOf: Schema[] }
export interface SchemaAllOf { allOf: Schema[] }

/**
 * Standalone primitive type that is itself optional (driven by the `type` field).
 * Used in handler input/output to mean "this field is optional / make it optional".
 */
export interface SchemaOptional {
  required: boolean
  type: Schema
}

/**
 * The data Schema.
 * - SchemaArray is a native array (elements are Schemas)
 * - composite types use { oneOf | anyOf | allOf: Schema[] }
 * - optional object properties are wrapped with `SchemaOptional` ({ required: false, type: Schema });
 *   a standalone optional primitive uses the same SchemaOptional wrapper
 */
export type Schema
  = SchemaPrimitive
    | SchemaReference
    | SchemaArray
    | SchemaEnum
    | SchemaOneOf
    | SchemaAnyOf
    | SchemaAllOf
    | SchemaOptional

interface ModifierConfig {
  /**
   * The scope the modifier applies to (which parameter location to process).
   */
  scope: ModifierScope
  /**
   * Match rule. Only matched fields are transformed; when omitted, all fields are transformed.
   * - string: the original field name contains this string
   * - RegExp: the original field name matches this pattern
   * - function: receives the key and returns a boolean indicating a match
   */
  match?: string | RegExp | ((key: string) => boolean)
  /**
   * handler flexibly modifies the parameter type value.
   * @param schema the original field type, already converted to the user-facing Schema representation.
   *               When the field itself is optional and is a primitive, it is passed as { required: false, type: 'string' }.
   *               Narrow the type inside handler if needed (e.g. with a cast).
   * @param key the matched field key. When `match` is omitted, the whole scope object is passed to the handler
   *            once and `key` is `undefined`; when `match` is set, `key` is the matched field name for each call.
   * @returns Schema to change the type; { required: boolean, type: Schema } to change requiredness (driven by `type`);
   *          void | null | undefined to remove the field.
   */
  handler: (schema: Schema, key?: string) => Schema | { required: boolean, type: Schema } | void | null | undefined
}

export type PayloadModifierConfig = ModifierConfig
