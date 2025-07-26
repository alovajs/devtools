import { SchemaNormalizer } from './normalizer'
import convertTypeArray from './rules/convertTypeArray'
import handleEmptyType from './rules/handleEmptyType'
import inferType from './rules/inferType'
import mergeAnyOf from './rules/mergeAnyOf'
import normalizeCombiningKeywords from './rules/normalizeCombiningKeywords'
import normalizeEnum from './rules/normalizeEnum'
import normalizeNullType from './rules/normalizeNullType'
import removeRedundantKeywords from './rules/removeRedundantKeywords'
import simplifySingleType from './rules/simplifySingleType'
import validateSchema from './rules/validateSchema'

const normalizer = new SchemaNormalizer()

// ================= 注册规则 =================
normalizer
  .addRule({
    name: 'inferType',
    description: '从关键字推断类型',
    handler: inferType,
  })
  .addRule({
    name: 'normalizeNullType',
    description: '规范化 null 类型',
    handler: normalizeNullType,
  })
  .addRule({
    name: 'convertTypeArray',
    description: '将 type 数组转换为 anyOf 结构',
    handler: convertTypeArray,
  })
  .addRule({
    name: 'normalizeEnum',
    description: '规范化枚举类型',
    handler: normalizeEnum,
  })
  .addRule({
    name: 'normalizeCombiningKeywords',
    description: '规范化anyOf/oneOf/allOf 关键字',
    handler: normalizeCombiningKeywords,
  })
  .addRule({
    name: 'mergeAnyOf',
    description: '合并anyOf中type相同的分支',
    handler: mergeAnyOf,
  })
  .addRule({
    name: 'removeRedundantKeywords',
    description: '移除多余关键字',
    handler: removeRedundantKeywords,
  })
  .addRule({
    name: 'handleEmptyType',
    description: '处理空类型定义',
    handler: handleEmptyType,
  })
  .addRule({
    name: 'simplifySingleType',
    description: '简化单元素类型数组',
    handler: simplifySingleType,
  })
  .addRule({
    name: 'validateSchema',
    description: '验证 schema 的有效性',
    handler: validateSchema,
  })

export default normalizer
