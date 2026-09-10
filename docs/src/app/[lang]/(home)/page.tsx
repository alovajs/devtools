import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n'
import { HomeView } from '@/components/HomeView'
import { isLocale } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  return {
    title: getHomeDict(locale).metaTitle,
  }
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'

  return <HomeView locale={locale} />
}
