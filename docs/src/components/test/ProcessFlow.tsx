import Icon from './Icon'

export default function ProcessFlow() {
  return (
    <section className="p-12 lg:p-24 tech-border-b bg-surface relative">
      <div className="absolute top-4 left-4 font-data-mono text-[10px] text-outline tracking-widest">FLOW_VISUALIZATION_V2</div>
      <h2 className="font-headline-lg text-4xl text-on-background mb-16 text-center uppercase font-bold tracking-tighter">从 OpenAPI 到生产代码</h2>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-5xl mx-auto relative">
        <div className="w-full lg:w-56 p-6 tech-border bg-background relative">
          <div className="absolute -top-3 left-4 bg-background px-2 text-[9px] font-data-mono text-primary">INPUT</div>
          <Icon name="description" className="text-primary mb-4 text-3xl" />
          <span className="font-data-mono text-xs text-on-background uppercase block">交付 OpenAPI</span>
          <div className="mt-4 h-[1px] bg-outline w-full relative">
            <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>

        <div className="hidden lg:block flex-grow h-[1px] bg-primary relative">
          <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-primary rotate-45" />
        </div>

        <div className="w-full lg:w-72 p-8 tech-border bg-background border-primary relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-primary flex items-center justify-center mb-4">
              <Icon name="settings" className="text-black text-3xl animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <span className="font-headline-lg text-xl text-primary font-bold tracking-widest uppercase">worma Engine</span>
            <div className="mt-2 font-data-mono text-[9px] text-on-surface-variant tracking-widest">COMPILING_LOGIC...</div>
          </div>
        </div>

        <div className="hidden lg:block flex-grow h-[1px] bg-primary relative">
          <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-primary rotate-45" />
        </div>

        <div className="w-full lg:w-56 grid grid-cols-2 gap-2 relative">
          <div className="absolute -top-3 left-4 bg-surface px-2 text-[9px] font-data-mono text-primary">ARTIFACTS</div>
          <div className="p-3 tech-border bg-background text-center">
            <span className="font-data-mono text-[10px] text-on-surface-variant block">Code</span>
          </div>
          <div className="p-3 tech-border bg-background text-center">
            <span className="font-data-mono text-[10px] text-on-surface-variant block">Types</span>
          </div>
          <div className="p-3 tech-border bg-background text-center">
            <span className="font-data-mono text-[10px] text-on-surface-variant block">Docs</span>
          </div>
          <div className="p-3 tech-border bg-primary text-black text-center">
            <span className="font-data-mono text-[10px] font-bold block">AI Skill</span>
          </div>
        </div>
      </div>
    </section>
  )
}
