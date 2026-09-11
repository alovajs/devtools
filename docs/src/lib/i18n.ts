/**
 * 站点级 i18n 语言配置。
 *
 * 默认语言为英文（en），中文（zh）为备选。
 * fumadocs 的 source loader、RootProvider 以及各页面路由均依赖此配置。
 */
export const locales = ['en', 'zh'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** 语言下拉菜单中展示的名称 */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
}

/** 设置 <html lang> 属性时使用的 BCP-47 标签 */
export const htmlLang: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/** 在给定路径上替换 / 补全语言前缀，例如 en -> /en/docs、zh -> /zh/docs */
export function withLocale(locale: Locale, pathname: string): string {
  const segments = pathname.split('/')
  // segments[0] 永远为空字符串（开头的 /）
  if (isLocale(segments[1] ?? ''))
    segments[1] = locale
  else
    segments.splice(1, 0, locale)
  return segments.join('/') || '/'
}

/**
 * 语言路径前缀。默认语言（en）不加前缀（''），其余语言加 `/{locale}`。
 * 例如 en -> ''、zh -> '/zh'，用于拼接导航/内链，使默认语言直接挂在根路径下。
 */
export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? '' : `/${locale}`
}

/**
 * 将可能带语言前缀的文档链接归一化为当前语言下的路径：
 * - /en/docs/foo 在 en 下 -> /docs/foo，在 zh 下 -> /zh/docs/foo
 * - /zh/docs/foo 在 en 下 -> /docs/foo，在 zh 下 -> /zh/docs/foo
 * - /docs/foo（无前缀）按当前语言补前缀
 * 其余（相对路径、外链、非文档路径）原样返回，交给 createRelativeLink 处理。
 */
export function normalizeHref(href: string, locale: Locale): string {
  const prefix = localePrefix(locale)
  const langPart = locales.join('|')
  const m = href.match(new RegExp(`^/(${langPart})(/.*)?$`))
  if (m) {
    const rest = m[2] ?? ''
    return rest ? `${prefix}${rest}` : (prefix || '/')
  }
  if (href.startsWith('/docs'))
    return `${prefix}${href}`
  return href
}

/**
 * 递归重写文档树中的链接，去掉硬编码语言前缀，随当前语言切换。
 * 用于侧边栏 / 面包屑 / 上一页下一页等由 page tree 生成的导航。
 */
export function localizePageTree(
  tree: import('fumadocs-core/page-tree').Root,
  locale: Locale,
): import('fumadocs-core/page-tree').Root {
  const map = (nodes: import('fumadocs-core/page-tree').Node[]): import('fumadocs-core/page-tree').Node[] =>
    nodes.map((node) => {
      if ('children' in node)
        return { ...node, children: map(node.children) }
      if ('url' in node)
        return { ...node, url: normalizeHref(node.url, locale) }
      return node
    })
  return { ...tree, children: map(tree.children) }
}
