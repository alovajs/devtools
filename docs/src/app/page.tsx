import type { Metadata } from 'next'
import { HomeLayoutShell } from '@/components/HomeLayoutShell'
import { HomeView } from '@/components/HomeView'
import { Provider } from '@/components/provider'
import { defaultLocale } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'

/**
 * 站点根路径：默认语言（en）直接挂在 `/` 下，不再重定向到 `/en`。
 * 中文等其它语言仍走 `/{locale}` 前缀（见 app/[lang]/...）。
 */
export const metadata: Metadata = {
  title: getHomeDict(defaultLocale).metaTitle,
}

export default function RootHome() {
  return (
    <Provider locale={defaultLocale}>
      <HomeLayoutShell locale={defaultLocale}>
        <HomeView locale={defaultLocale} />
      </HomeLayoutShell>
    </Provider>
  )
}
