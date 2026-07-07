import { llms } from 'fumadocs-core/source'
import { getPageMarkdownUrl, source } from '@/lib/source'

export const revalidate = false

export function GET() {
  const markdownUrlMap = new Map<string, string>()
  for (const page of source.getPages()) {
    markdownUrlMap.set(page.url, getPageMarkdownUrl(page).url)
  }

  const text = llms(source).index().replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, title, url) => {
      const markdownUrl = markdownUrlMap.get(url)
      return markdownUrl ? `[${title}](${markdownUrl})` : match
    },
  )

  return new Response(text)
}
