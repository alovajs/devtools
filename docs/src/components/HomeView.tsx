import type { Locale } from '@/lib/i18n'
import ChangeLog from '@/components/home/ChangeLog'
import Cta from '@/components/home/Cta'
import Features from '@/components/home/Features'
import Footer from '@/components/home/Footer'
import Hero from '@/components/home/Hero'
import IdeEditor from '@/components/home/IdeEditor'
import Matrix from '@/components/home/Matrix'
import Plugins from '@/components/home/Plugins'
import ProcessFlow from '@/components/home/ProcessFlow'

/**
 * 首页正文。语言无关，渲染逻辑统一由此组件承担，
 * 默认语言（en）与 [lang] 路由都复用它，避免重复。
 */
export function HomeView({ locale }: { locale: Locale }) {
  return (
    <div className="min-h-screen flex flex-col font-body-md bg-background text-on-background worma-bg selection:bg-primary selection:text-background">
      {/* 顶部导航栏由 fumadocs HomeLayout 统一管理 */}
      <main className="flex-grow w-full max-w-7xl mx-auto bg-background/50 backdrop-blur-sm tech-border-l tech-border-r">
        <Hero lang={locale} />
        <Features lang={locale} />
        <ProcessFlow lang={locale} />
        <Matrix lang={locale} />
        <Plugins lang={locale} />
        <ChangeLog lang={locale} />
        <IdeEditor lang={locale} />
        <Cta lang={locale} />
      </main>
      <Footer lang={locale} />
    </div>
  )
}
