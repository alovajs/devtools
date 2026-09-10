import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { BookOpen, ExternalLink, Heart, Puzzle, Users } from 'lucide-react'
import { ForceDarkTheme } from '@/components/ForceDarkTheme'
import { localePrefix } from '@/lib/i18n'
import { baseOptions } from '@/lib/layout.shared'

const navLabels: Record<Locale, { docs: string, plugins: string, changelog: string, sponsor: string, contributors: string }> = {
  en: {
    docs: 'Docs',
    plugins: 'Plugins',
    changelog: 'Changelog',
    sponsor: 'Sponsor',
    contributors: 'Contributors',
  },
  zh: {
    docs: '文档',
    plugins: '插件',
    changelog: '发布日志',
    sponsor: '赞助',
    contributors: '贡献者',
  },
}

/**
 * 首页布局外壳：HomeLayout + 顶部导航。
 * 不含 RootProvider（由上层 [lang]/layout 或根 page 提供），
 * 仅负责导航与外壳，默认语言下链接前缀为空（挂在根路径）。
 */
export function HomeLayoutShell({ locale, children }: { locale: Locale, children: ReactNode }) {
  const t = navLabels[locale]
  const base = localePrefix(locale)

  return (
    <ForceDarkTheme>
      <HomeLayout
        {...baseOptions()}
        links={[
          {
            icon: <BookOpen className="h-4 w-4" />,
            text: t.docs,
            url: `${base}/docs`,
            active: 'nested-url',
          },
          {
            icon: <Puzzle className="h-4 w-4" />,
            text: t.plugins,
            url: `${base}/docs/plugin-system`,
          },
          {
            icon: <ExternalLink className="h-4 w-4" />,
            text: t.changelog,
            url: 'https://github.com/alovajs/devtools/releases',
          },
          {
            icon: <Heart className="h-4 w-4" />,
            text: t.sponsor,
            url: `${base}/docs/sponsor`,
          },
          {
            icon: <Users className="h-4 w-4" />,
            text: t.contributors,
            url: `${base}/docs/contributors`,
          },
        ]}
      >
        {children}
      </HomeLayout>
    </ForceDarkTheme>
  )
}
