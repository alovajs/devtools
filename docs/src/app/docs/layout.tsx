import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'
import { DefaultSystemTheme } from '@/components/DefaultSystemTheme'

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
      {/* 文档默认跟随系统配色，同时仍支持手动切换 */}
      <DefaultSystemTheme />
      {children}
    </DocsLayout>
  )
}
