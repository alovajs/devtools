export type ModifierScope = 'params' | 'pathParams' | 'data' | 'response'
export type SchemaPrimitive = 'number' | 'string' | 'boolean' | 'undefined' | 'null' | 'unknown' | 'any' | 'never' | ({} & string)

/**
 * 表示数组类型
 */
export interface SchemaArray {
  type: 'array'
  // 支持普通数组（items 为单个 schema）与元组数组（items 为 schema 数组）
  items: Schema | Schema[]
}

/**
 * 修改参数为引用类型
 * 在key末端添加上?表示为可选值
 */
export interface SchemaReference {
  [attr: string]: Schema
}

/**
 * 枚举类型表示
 */
export interface SchemaEnum {
  enum: Array<string | number | boolean | null>
  type?: SchemaPrimitive
}

/**
 * 组合类型表示（与/或/交叉）
 */
export interface SchemaOneOf { oneOf: Schema[] }
export interface SchemaAnyOf { anyOf: Schema[] }
export interface SchemaAllOf { allOf: Schema[] }

/**
 * 数据Schema
 * SchemaArray表示类型数组，而数组表示“或”的意思
 */
export type Schema
  = | SchemaPrimitive
    | SchemaReference
    | SchemaArray
    | SchemaEnum
    | SchemaOneOf
    | SchemaAnyOf
    | SchemaAllOf
   // 兼容旧写法：数组表示 oneOf 联合类型
    | Array<SchemaPrimitive | SchemaReference | SchemaArray | SchemaEnum>

interface ModifierConfig<T extends Schema> {
  /**
   * 生效范围，表示处理哪个位置的参数
   */
  scope: ModifierScope
  /**
   * 匹配规则，只有匹配到的才会进行转换，不指定则转换全部
   * string：原参数名包含此string；RegExp：原参数名匹配此正则；函数时接收key并返回是否匹配的boolean值
   */
  match?: string | RegExp | ((key: string) => boolean)
  /**
   * handler用于灵活修改参数类型值
   * @param schema Schema中的一种，由用户自行定义
   * @returns 返回多种参数，具体为：Schema表示修改的类型；{ required: boolean, value: Schema }表示可将当前值修改为是否必填；void | null | undefined表示移除当前字段
   */
  handler: (schema: T) => Schema | { required: boolean, value: Schema } | void | null | undefined
}

export type PayloadModifierConfig = ModifierConfig<Schema>
