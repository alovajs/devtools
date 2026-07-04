import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { BookOpen, ExternalLink, Heart, Puzzle } from 'lucide-react'
import { ForceDarkTheme } from '@/components/ForceDarkTheme'
import { baseOptions } from '@/lib/layout.shared'

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <ForceDarkTheme>
      <HomeLayout
        {...baseOptions()}
        links={[
          {
            icon: <BookOpen className="h-4 w-4" />,
            text: '文档',
            url: '/docs',
            active: 'nested-url',
          },
          {
            icon: <Puzzle className="h-4 w-4" />,
            text: '插件',
            url: '/docs/plugin-system',
          },
          {
            icon: <ExternalLink className="h-4 w-4" />,
            text: '发布日志',
            url: 'https://github.com/alovajs/devtools/releases',
          },
          {
            icon: <Heart className="h-4 w-4" />,
            text: '赞助',
            url: '/docs/sponsor',
          },
        ]}
      >
        {children}
      </HomeLayout>
    </ForceDarkTheme>
  )
}
