import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsView } from '@/components/DocsView'
import { defaultLocale } from '@/lib/i18n'
import { getPageImage, source } from '@/lib/source'

interface DocsParams {
  params: Promise<{ slug?: string[] }>
}

export default async function Page(props: DocsParams) {
  const params = await props.params
  return <DocsView locale={defaultLocale} slug={params.slug} />
}

export async function generateStaticParams() {
  return source.getPages(defaultLocale).map(page => ({ slug: page.slugs }))
}

export async function generateMetadata(props: DocsParams): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug, defaultLocale)
  if (!page)
    notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  }
}
