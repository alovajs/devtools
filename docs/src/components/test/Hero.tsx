import Button from './Button'
import CornerPlus from './CornerPlus'
import Icon from './Icon'

export default function Hero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 tech-border-b relative">
      <div className="p-8 lg:p-16 flex flex-col justify-center lg:tech-border-r relative">
        <CornerPlus />
        <div className="inline-flex items-center gap-3 mb-8 text-primary font-data-mono text-[10px] tracking-[0.2em]">
          <span className="w-2 h-2 bg-primary" />
          SYSTEM_INIT // v1.2.48_STABLE
        </div>
        <h1 className="font-headline-lg text-5xl lg:text-7xl text-on-background mb-8 leading-[0.95] tracking-tighter uppercase font-bold">
          一份 OpenAPI,<br />
          从人类到<span className="text-primary italic">AI</span>
        </h1>
        <p className="font-body-md text-sm text-on-surface-variant mb-12 max-w-md leading-relaxed">
          为你生成类型安全的接口代码，为AI生成易理解的接口知识。统一规范，加速协同。
        </p>
        <div className="flex flex-wrap gap-0">
          <Button variant="primary" icon="arrow_forward">即刻体验</Button>
          <Button variant="outline">快速开始</Button>
        </div>
        <div className="absolute bottom-4 left-8 font-data-mono text-[10px] text-outline">LATENCY: 14MS // SECTOR: 0x4F</div>
      </div>
      <div className="p-8 lg:p-16 flex items-center justify-center bg-surface relative overflow-hidden">
        <div className="scan-line" />
        <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 0)', backgroundSize: '16px 16px' }}
          />
          <div className="relative z-10 mix-blend-difference" />
        </div>
      </div>
    </section>
  )
}
