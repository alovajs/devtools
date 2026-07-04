import type { Metadata } from 'next'
import Cta from '@/components/test/Cta'
import Features from '@/components/test/Features'
import Footer from '@/components/test/Footer'
import Header from '@/components/test/Header'
import Hero from '@/components/test/Hero'
import IdeEditor from '@/components/test/IdeEditor'
import Matrix from '@/components/test/Matrix'
import Plugins from '@/components/test/Plugins'
import ProcessFlow from '@/components/test/ProcessFlow'

export const metadata: Metadata = {
  title: 'worma - 一份 OpenAPI，从人类到AI',
}

export default function TestPage() {
  return (
    <div className="min-h-screen flex flex-col font-body-md bg-background text-on-background worma-bg selection:bg-primary selection:text-background">
      <Header />
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
