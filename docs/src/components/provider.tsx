import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import SearchDialog from '@/components/search'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      theme={{
        // 默认跟随系统配色；允许手动切换
        defaultTheme: 'system',
        enableSystem: true,
        disableTransitionOnChange: true,
      }}
    >
      {children}
    </RootProvider>
  )
}
