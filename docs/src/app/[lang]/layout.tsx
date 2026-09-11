import type { Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { Provider } from '@/components/provider'
import { isLocale, locales } from '@/lib/i18n'

export function generateStaticParams() {
  return locales.map(lang => ({ lang }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang))
    notFound()

  return <Provider locale={lang as Locale}>{children}</Provider>
}
