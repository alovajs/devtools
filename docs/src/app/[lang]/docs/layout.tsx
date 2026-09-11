import type { Locale } from '@/lib/i18n'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { DefaultSystemTheme } from '@/components/DefaultSystemTheme'
import { isLocale, localizePageTree } from '@/lib/i18n'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'en'

  return (
    <DocsLayout tree={localizePageTree(source.getPageTree(locale), locale)} {...baseOptions()}>
      {/* 文档默认跟随系统配色，同时仍支持手动切换 */}
      <DefaultSystemTheme />
      {children}
    </DocsLayout>
  )
}
