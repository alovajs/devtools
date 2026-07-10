import { Inter } from 'next/font/google'
import { Provider } from '@/components/provider'
import { DefaultSystemTheme } from '@/components/DefaultSystemTheme'
import './global.css'

const inter = Inter({
  subsets: ['latin'],
})

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/img/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Provider>
          {/* 非首页（首页强制深色）默认跟随系统配色 */}
          <DefaultSystemTheme skipHome />
          {children}
        </Provider>
      </body>
    </html>
  )
}
