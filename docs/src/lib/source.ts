import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { slugsFromData, slugsPlugin } from 'fumadocs-core/source/plugins/slugs'
import { defaultLocale, locales } from './i18n'

import { docsContentRoute, docsImageRoute, docsRoute } from './shared'

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  // i18n: 内容按语言目录组织（content/docs/<locale>/...），
  // 默认语言为英文，中文作为备选回退。
  i18n: {
    languages: [...locales],
    defaultLanguage: defaultLocale,
    parser: 'dir',
    fallbackLanguage: 'zh',
  },
  // Allow page frontmatter to override the default slugs (path-derived),
  // e.g. to strip the "01-" / "02-" numeric prefix from file names.
  plugins: [slugsPlugin(slugsFromData())],
})

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png']

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  }
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  // page.url 已含语言前缀：英文为 /docs/...，中文为 /zh/docs/...
  // 映射到 /llms.mdx/docs 命名空间，并保留语言前缀（默认语言不加前缀，避免与现有英文链接冲突）。
  const parts = page.url.replace(/^\//, '').split('/') // ['docs', ...] 或 ['zh', 'docs', ...]

  let locale: string | undefined
  let docParts: string[]
  if (parts[0] === 'docs') {
    docParts = parts.slice(1)
  }
  else {
    locale = parts[0]
    docParts = parts.slice(2)
  }

  const last = docParts.at(-1)

  // Static export route: /llms.mdx/quick-start.md
  // Root docs page maps to /llms.mdx/index.md
  const segments
    = last === undefined
      ? ['index.md']
      : [...docParts.slice(0, -1), `${last}.md`]

  // 非默认语言需把语言段写入路径，否则中文 markdown 会与英文冲突
  if (locale && locale !== defaultLocale) {
    segments.unshift(locale)
  }

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  }
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title} (${page.url})

${processed}`
}
