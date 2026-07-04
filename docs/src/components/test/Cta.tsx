import Button from './Button'
import CornerPlus from './CornerPlus'

export default function Cta() {
  return (
    <section className="p-12 lg:p-32 bg-cta-bg relative overflow-hidden tech-border-b">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      <div className="max-w-4xl mx-auto relative text-center">
        <CornerPlus />
        <div className="font-data-mono text-[10px] text-primary mb-8 uppercase tracking-[0.4em] animate-pulse">// READY_FOR_DEPLOYMENT</div>
        <h2 className="font-headline-lg text-5xl lg:text-7xl text-on-background mb-12 uppercase font-bold tracking-tighter">
          「开始使用」
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button variant="primary" size="lg" icon="rocket_launch" className="w-full sm:w-auto" href="/docs/quick-start">免费开始</Button>
          <Button variant="outline" size="lg" className="px-10 w-full sm:w-auto" href="/docs">查看文档</Button>
          <Button variant="outline" size="lg" icon="code" className="px-10 w-full sm:w-auto" href="https://github.com/alovajs/devtools">GitHub</Button>
        </div>
        <p className="font-data-mono text-xs text-on-surface-variant tracking-widest uppercase">
          从 OpenAPI 到生产代码，一步到位
        </p>
        <div className="mt-16 flex justify-center">
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </div>
    </section>
  )
}
