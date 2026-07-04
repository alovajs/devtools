import Image from 'next/image'
import Icon from './Icon'

export default function ProcessFlow() {
  return (
    <section className="tech-border-b bg-surface relative p-12 lg:p-24">
      <div className="font-data-mono text-outline absolute left-4 top-4 text-[10px] tracking-widest">FLOW_VISUALIZATION_V2</div>
      <h2 className="font-headline-lg text-on-background mb-16 text-center text-4xl font-bold tracking-tighter uppercase">从 OpenAPI 到生产代码</h2>
      <div className="relative mx-auto max-w-5xl flex flex-col items-center justify-between gap-12 lg:flex-row">
        <div className="tech-border bg-background relative w-full p-6 lg:w-56">
          <div className="bg-background font-data-mono text-primary absolute left-4 px-2 text-[9px] -top-3">INPUT</div>
          <Icon name="description" className="text-primary mb-4 text-3xl" />
          <span className="font-data-mono text-on-background block text-xs uppercase">交付 OpenAPI</span>
          <div className="bg-outline relative mt-4 h-[1px] w-full">
            <div className="bg-primary absolute h-2 w-2 rounded-full -right-1 -top-1" />
          </div>
        </div>

        <div className="bg-primary relative hidden h-[1px] flex-grow lg:block">
          <div className="border-primary absolute right-0 h-2 w-2 rotate-45 border-r border-t -top-1" />
        </div>

        <div className="group relative w-full p-8 lg:w-72">
          <div className="bg-primary/5 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="tech-border border-primary mb-4 h-12 w-12 flex items-center justify-center">
              <Image src="/img/logo.svg" alt="worma" width={28} height={28} className="h-7 w-7 animate-spin" style={{ animationDuration: '5s' }} />
            </div>
            <span className="font-headline-lg text-primary text-xl font-bold tracking-widest uppercase">worma Engine</span>
            <div className="font-data-mono text-on-surface-variant mt-2 text-[9px] tracking-widest">COMPILING_LOGIC...</div>
          </div>
        </div>

        <div className="bg-primary relative hidden h-[1px] flex-grow lg:block">
          <div className="border-primary absolute right-0 h-2 w-2 rotate-45 border-r border-t -top-1" />
        </div>

        <div className="relative grid grid-cols-2 w-full gap-2 lg:w-56">
          <div className="bg-surface font-data-mono text-primary absolute left-4 px-2 text-[9px] -top-3">ARTIFACTS</div>
          <div className="tech-border bg-background p-3 text-center">
            <span className="font-data-mono text-on-surface-variant block text-[10px]">Code</span>
          </div>
          <div className="tech-border bg-background p-3 text-center">
            <span className="font-data-mono text-on-surface-variant block text-[10px]">Types</span>
          </div>
          <div className="tech-border bg-background p-3 text-center">
            <span className="font-data-mono text-on-surface-variant block text-[10px]">Docs</span>
          </div>
          <div className="tech-border bg-primary p-3 text-center text-black">
            <span className="font-data-mono block text-[10px] font-bold">AI Skill</span>
          </div>
        </div>
      </div>
    </section>
  )
}
