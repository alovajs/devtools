import { notFound } from 'next/navigation'
import { getLLMText, getPageMarkdownUrl, source } from '@/lib/source'

export const revalidate = false

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params
  const segments = slug ?? []
  const last = segments.at(-1) ?? 'index.md'
  const rest = segments.slice(0, -1)

  // The public URL ends with `.md` (e.g. /llms.mdx/docs/quick-start.md).
  // Convert it back to the page slugs used by the docs source.
  const pageSlugs = last === 'index.md'
    ? rest
    : [...rest, last.replace(/\.md$/, '')]

  const page = source.getPage(pageSlugs)
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
