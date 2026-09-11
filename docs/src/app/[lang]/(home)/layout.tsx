import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { HomeLayoutShell } from '@/components/HomeLayoutShell'
import { isLocale } from '@/lib/i18n'

export default async function Layout({ children, params }: { children: ReactNode, params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'
  return <HomeLayoutShell locale={locale}>{children}</HomeLayoutShell>
}
