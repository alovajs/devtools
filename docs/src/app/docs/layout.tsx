import type { ReactNode } from 'react'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { Provider } from '@/components/provider'
import { defaultLocale, localizePageTree } from '@/lib/i18n'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

/**
 * 根路径文档布局：默认语言（en）直接挂在 `/docs` 下。
 * 该路由没有 [lang] 父级布局，因此在此同时提供 RootProvider 与 DocsLayout。
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Provider locale={defaultLocale}>
      <DocsLayout tree={localizePageTree(source.getPageTree(defaultLocale), defaultLocale)} {...baseOptions()}>
        {children}
      </DocsLayout>
    </Provider>
  )
}
