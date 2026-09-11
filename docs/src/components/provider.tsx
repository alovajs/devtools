'use client'

import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import SearchDialog from '@/components/search'
import { defaultLocale, isLocale, localeNames, locales } from '@/lib/i18n'
import { zhTranslations } from '@/lib/i18n-ui'

export function Provider({ children, locale }: { children: ReactNode, locale: Locale }) {
  const pathname = usePathname()
  const router = useRouter()

  // 语言切换：替换 / 补全 URL 中的语言前缀并跳转。
  // 默认语言（en）无前缀，切到它时移除语言段；其余语言插入 /{locale}。
  const onChange = useCallback(
    (next: string) => {
      const segments = pathname.split('/')
      // segments[0] 为空（开头的 /），segments[1] 为语言段
      const hasPrefix = isLocale(segments[1] ?? '')
      if (next === defaultLocale) {
        if (hasPrefix)
          segments.splice(1, 1)
      }
      else if (hasPrefix) {
        segments[1] = next
      }
      else {
        segments.splice(1, 0, next)
      }
      router.push(segments.join('/') || '/')
    },
    [pathname, router],
  )

  return (
    <RootProvider
      search={{ SearchDialog }}
      theme={{
        // 默认跟随系统配色；允许手动切换
        defaultTheme: 'system',
        enableSystem: true,
        disableTransitionOnChange: true,
      }}
      i18n={{
        locale,
        locales: locales.map(l => ({ locale: l, name: localeNames[l] })),
        onLocaleChange: onChange,
        ...(locale === 'zh' ? { translations: zhTranslations } : {}),
      }}
    >
      {children}
    </RootProvider>
  )
}
