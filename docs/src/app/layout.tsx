import { Inter } from 'next/font/google'
import { Provider } from '@/components/provider'
import './global.css'

const inter = Inter({
  subsets: ['latin'],
})

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
