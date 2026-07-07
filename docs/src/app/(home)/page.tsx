import type { Metadata } from 'next'
import Cta from '@/components/home/Cta'
import Features from '@/components/home/Features'
import Footer from '@/components/home/Footer'
import Hero from '@/components/home/Hero'
import IdeEditor from '@/components/home/IdeEditor'
import Matrix from '@/components/home/Matrix'
import Plugins from '@/components/home/Plugins'
import ProcessFlow from '@/components/home/ProcessFlow'

export const metadata: Metadata = {
  title: 'worma - 一份 OpenAPI，从人类到AI',
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col font-body-md bg-background text-on-background worma-bg selection:bg-primary selection:text-background">
      {/* 顶部导航栏由 fumadocs HomeLayout 统一管理 */}
      <main className="flex-grow w-full max-w-7xl mx-auto bg-background/50 backdrop-blur-sm tech-border-l tech-border-r">
        <Hero />
        <Features />
        <ProcessFlow />
        <IdeEditor />
        <Matrix />
        <Plugins />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
