'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { htmlLang, isLocale } from '@/lib/i18n'

/**
 * 根据当前 URL 的语言前缀同步 <html lang> 属性。
 *
 * 根布局无法拿到 [lang] 动态段，因此用客户端方式在路由切换时
 * 把 `lang` 修正为对应语言，保证屏幕阅读器与 SEO 使用正确的语言标签。
 */
export function HtmlLangSync() {
  const pathname = usePathname()

  useEffect(() => {
    const segment = pathname.split('/')[1] ?? ''
    const lang = isLocale(segment) ? htmlLang[segment] : htmlLang.en
    document.documentElement.lang = lang
  }, [pathname])

  return null
}
