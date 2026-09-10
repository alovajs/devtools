import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

export const revalidate = false

export const { staticGET: GET } = createFromSource(source, {
  // 中文缺乏专用词干分析器，回退到英文分词器以保证索引构建稳定。
  // 英文沿用默认英文分词器。
  localeMap: {
    zh: { language: 'english' },
  },
})
