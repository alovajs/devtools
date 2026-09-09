import type { SchemaObject } from '@/type'

/**
 * The part of the API the modification applies to.
 * - `params` — query parameters
 * - `pathParams` — path parameters
 * - `data` — request body
 * - `response` — response body
 */
export type ModifierScope = 'params' | 'pathParams' | 'data' | 'response'

/**
 * A matching rule.
 * - string: the value contains this substring
 * - RegExp: the value matches this pattern
 * - function: a predicate receiving the value
 */
export type Matcher = string | RegExp | ((value: string) => boolean)

/**
 * Type expressions understood by the plugin. TS-only types (`undefined`, `unknown`,
 * `any`, `never`) are valid and are written through to the schema as-is.
 */
export type SchemaPrimitive
  = | 'number'
    | 'string'
    | 'boolean'
    | 'undefined'
    | 'null'
    | 'unknown'
    | 'any'
    | 'never'

/**
 * The spec DSL. It only ever *describes a type*, therefore it always appears in a type
 * value position (`FieldPatchObject.type`, `FieldPatchObject.items`, union members, ...).
 */
export type SchemaDSL
  /** a primitive type */
  = | SchemaPrimitive
  /** `['string']` = `string[]`, `['string', 'number']` = the tuple `[string, number]` */
    | SchemaDSL[]
    | { oneOf: SchemaDSL[] }
    | { anyOf: SchemaDSL[] }
    | { allOf: SchemaDSL[] }
    | { enum: Array<string | number | boolean | null>, type?: SchemaPrimitive }
  /** object shorthand: every listed field is required */
    | { [field: string]: SchemaDSL }

/**
 * OpenAPI keywords usable inside a patch object. Every other key is documented by the
 * plugin itself, so a patch object holding one of these keys is a partial patch of the
 * target while an object holding none of them is a shorthand for `properties`.
 */
export interface FieldPatchObject {
  /** Replaces the type: type-family keys are cleared, documentation keys are kept. */
  type?: SchemaDSL
  /** Field-level requiredness, translated to the parent `required` array (or to `ParameterObject.required`). */
  required?: boolean
  description?: string
  /** Explicit field-table patch, also the escape hatch when a field is named like a reserved key. */
  properties?: Record<string, FieldValue>
  items?: SchemaDSL
  enum?: Array<string | number | boolean | null>
  oneOf?: SchemaDSL[]
  anyOf?: SchemaDSL[]
  allOf?: SchemaDSL[]
  format?: string
  example?: unknown
  default?: unknown
  deprecated?: boolean
  nullable?: boolean
  title?: string
}

/**
 * A field table: an object without reserved keys, read as a patch of the field table of
 * the target. Every value follows the same rules as `FieldValue`, recursively.
 */
export interface FieldTable {
  [field: string]: FieldValue
}

/**
 * A patch value. The same syntax is used for the top level `patch` and for every value
 * inside a field table, so the rules below apply recursively.
 *
 * | form | meaning |
 * | --- | --- |
 * | `null` | delete the target |
 * | string / array | shorthand for `{ type: value }`, documentation keys are kept |
 * | object without reserved keys | field table, merged into the target field table |
 * | object with reserved keys | partial patch of the target itself |
 */
export type FieldValue = null | SchemaDSL | FieldPatchObject | FieldTable

export interface ModifierConfig {
  /** The scope the config applies to. */
  scope: ModifierScope

  /** URL filter. Omitted = every API. Multiple rules are ORed, `path` and `tag` are ANDed. */
  path?: Matcher | Matcher[]

  /** Tag filter: any tag of the API hitting any rule makes the config apply. */
  tag?: Matcher | Matcher[]

  /** Replaces the scope root with a nested node, navigating along `properties` only. */
  unwrap?: string

  /** Locator. Omitted = the root itself, otherwise every matching top-level field. */
  match?: Matcher

  /** Declarative patch (add / delete / modify). Runs before `handler`. */
  patch?: FieldValue

  /**
   * Escape hatch taking and returning raw OpenAPI schema objects.
   * @param schema the located raw schema
   * @param key the located field name, `undefined` when the root itself is located
   * @returns the replacement schema, or `null` / `undefined` to delete the target
   */
  handler?: (schema: SchemaObject, key?: string) => SchemaObject | null | undefined
}

export type PayloadModifierConfig = ModifierConfig
