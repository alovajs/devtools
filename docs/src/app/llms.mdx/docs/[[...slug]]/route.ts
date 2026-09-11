import { notFound } from 'next/navigation'
import { defaultLocale, isLocale } from '@/lib/i18n'
import { getLLMText, getPageMarkdownUrl, source } from '@/lib/source'

export const revalidate = false

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params
  let segments = slug ?? []

  // 路径首段可能是语言（如 zh），需还原并传给 source.getPage 以取对应语言页面
  let locale = defaultLocale
  if (segments.length > 0 && isLocale(segments[0])) {
    locale = segments[0]
    segments = segments.slice(1)
  }

  const last = segments.at(-1) ?? 'index.md'
  const rest = segments.slice(0, -1)

  // The public URL ends with `.md` (e.g. /llms.mdx/docs/quick-start.md or
  // /llms.mdx/docs/zh/quick-start.md). Convert it back to the page slugs used
  // by the docs source, and resolve the page in the correct language.
  const pageSlugs = last === 'index.md'
    ? rest
    : [...rest, last.replace(/\.md$/, '')]

  const page = source.getPage(pageSlugs, locale)
  if (!page)
    notFound()

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  })
}

export function generateStaticParams() {
  return source.getPages().map(page => ({
    slug: getPageMarkdownUrl(page).segments,
  }))
}
