import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { DocsView } from '@/components/DocsView'
import { isLocale, locales } from '@/lib/i18n'
import { getPageImage, source } from '@/lib/source'

interface DocsParams {
  params: Promise<{ lang: string, slug?: string[] }>
}

export default async function Page(props: DocsParams) {
  const params = await props.params
  const locale: Locale = isLocale(params.lang) ? params.lang : 'en'
  return <DocsView locale={locale} slug={params.slug} />
}

export async function generateStaticParams() {
  return locales.flatMap(locale =>
    source.getPages(locale).map(page => ({ lang: locale, slug: page.slugs })),
  )
}

export async function generateMetadata(props: DocsParams): Promise<Metadata> {
  const params = await props.params
  const locale: Locale = isLocale(params.lang) ? params.lang : 'en'
  const page = source.getPage(params.slug, locale)
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
