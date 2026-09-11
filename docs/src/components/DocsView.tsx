import type { ComponentProps } from 'react'
import type { Locale } from '@/lib/i18n'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { notFound } from 'next/navigation'
import { getMDXComponents } from '@/components/mdx'
import { normalizeHref } from '@/lib/i18n'
import { gitConfig } from '@/lib/shared'
import { getPageMarkdownUrl, source } from '@/lib/source'

/**
 * 为 MDX 内链生成带语言前缀的链接。
 * 正文中的绝对路径 `/docs/...` 会被改写为 `/{locale}/docs/...`（默认语言前缀为空）。
 * 其余（相对路径、外链）交给 fumadocs 的 createRelativeLink 处理。
 */
function createLocalizedLink(
  src: typeof source,
  page: (typeof source)['$inferPage'],
  locale: Locale,
) {
  const relative = createRelativeLink(
    src as unknown as Parameters<typeof createRelativeLink>[0],
    page as unknown as Parameters<typeof createRelativeLink>[1],
  )
  return function LocalizedLink(props: ComponentProps<'a'>) {
    const href = props.href
    let target: string | undefined
    if (typeof href === 'string') {
      const normalized = normalizeHref(href, locale)
      if (normalized !== href)
        target = normalized
    }
    return relative({ ...props, ...(target ? { href: target } : {}) })
  }
}

/**
 * 文档页正文。语言无关，[lang] 路由与根路径（默认语言）复用它。
 */
export function DocsView({ locale, slug }: { locale: Locale, slug?: string[] }) {
  const page = source.getPage(slug, locale)
  if (!page)
    notFound()

  const MDX = page.data.body
  const markdownUrl = getPageMarkdownUrl(page).url

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createLocalizedLink(source, page, locale),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}
