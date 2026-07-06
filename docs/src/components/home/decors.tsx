import { Globe } from 'lucide-react'

/* ─── Dot grid background ─── */
export function DotGrid({
  className = '',
  color = '#d1d5db',
  opacity = 0.45,
}: {
  className?: string
  color?: string
  opacity?: number
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotgrid-decor" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={color} opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid-decor)" />
      </svg>
    </div>
  )
}

/* ─── Grid pattern overlay ─── */
export function GridOverlay({
  className = '',
  opacity = 0.04,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-decor" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-decor)" />
      </svg>
    </div>
  )
}

/* ─── Coordinate display ─── */
export function CoordDisplay({ className = '' }: { className?: string }) {
  return (
    <div className={`text-[10px] text-gray-500 tracking-wider font-mono ${className}`}>
      <div>X_36.1749</div>
      <div>Y_-86.7676</div>
      <div>Z_46.6827</div>
    </div>
  )
}

/* ─── Scene tag ─── */
export function SceneTag({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] text-gray-400 tracking-[0.2em] font-mono uppercase ${className}`}>
      {children}
    </span>
  )
}

/* ─── Section label ─── */
export function SectionLabel({ num, className = '' }: { num: string, className?: string }) {
  return (
    <span className={`text-brand-blue text-sm font-medium font-mono ${className}`}>
      /
      {num}
    </span>
  )
}

/* ─── Section header ─── */
export function SectionHeader({
  num,
  title,
  subtitle,
}: {
  num: string
  title: string
  subtitle: string
}) {
  return (
    <>
      <div className="mb-3 flex items-center gap-4">
        <SectionLabel num={num} />
        <h2 className="text-2xl text-gray-900 font-black tracking-tight">{title}</h2>
      </div>
      <p className="mb-14 ml-12 mt-1 text-sm text-gray-400 tracking-wide">{subtitle}</p>
    </>
  )
}

/* ─── Hero Visual (CSS-only animations via Tailwind animate-*) ─── */
export function HeroVisual() {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <DotGrid className="opacity-50" color="#0500ff" opacity={0.25} />

      {/* Floating plus signs */}
      <span className="text-brand-blue/15 absolute left-[15%] -top-4 animate-[float-plus_4s_ease-in-out_0s_infinite]"><PlusIcon /></span>
      <span className="text-brand-blue/15 absolute right-[8%] top-[20%] animate-[float-plus_4s_ease-in-out_1.2s_infinite]"><PlusIcon /></span>
      <span className="text-brand-blue/15 absolute bottom-[30%] left-[5%] animate-[float-plus_4s_ease-in-out_0.6s_infinite]"><PlusIcon /></span>
      <span className="text-brand-blue/15 absolute right-[20%] -bottom-2 animate-[float-plus_4s_ease-in-out_1.8s_infinite]"><PlusIcon /></span>
      <span className="text-brand-blue/15 absolute left-[25%] top-[55%] animate-[float-plus_4s_ease-in-out_2.4s_infinite]"><PlusIcon /></span>
      <span className="text-brand-blue/15 absolute left-[40%] top-[10%] animate-[float-plus_4s_ease-in-out_3s_infinite]"><PlusIcon /></span>

      {/* Floating decorative blocks */}
      <div className="bg-brand-blue/30 absolute left-[22%] top-[18%] h-8 w-8 rounded-sm animate-[float-block_5s_ease-in-out_infinite]" />
      <div className="bg-brand-lime/50 absolute right-[18%] top-[38%] h-6 w-6 rounded-sm animate-[float-block_4.5s_ease-in-out_0.5s_infinite]" />
      <div className="bg-brand-blue/25 absolute bottom-[28%] left-[28%] h-7 w-7 rounded-sm animate-[float-block_6s_ease-in-out_1s_infinite]" />
      <div className="bg-brand-blue/20 absolute bottom-[18%] right-[28%] h-9 w-9 rounded-sm animate-[float-block_5.5s_ease-in-out_1.5s_infinite]" />
      <div className="bg-brand-lime/60 absolute right-[35%] top-[62%] h-5 w-5 rounded-sm animate-[float-block_4s_ease-in-out_2s_infinite]" />
      <div className="bg-brand-blue/35 absolute right-[35%] top-[25%] h-6 w-6 rounded-sm animate-[float-block_7s_ease-in-out_0.8s_infinite]" />
      <div className="bg-brand-lime/40 absolute left-[10%] top-[42%] h-5 w-5 rounded-sm animate-[float-block_4.8s_ease-in-out_1.3s_infinite]" />

      {/* Big "A" */}
      <div className="relative z-10 select-none animate-[hero-float-a_5s_ease-in-out_1.5s_infinite]">
        <span
          className="[-webkit-text-stroke:2px_rgba(5,0,255,0.18)] block text-[180px] font-black leading-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #111 0px, #111 2px, transparent 2px, transparent 8px), repeating-linear-gradient(90deg, #111 0px, #111 2px, transparent 2px, transparent 8px)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          A
        </span>
        <div className="from-brand-blue/10 absolute inset-0 rounded via-transparent to-transparent bg-gradient-to-tr mix-blend-overlay" />
      </div>

      {/* Coordinate display */}
      <div className="absolute right-0 top-1/2 border-l-2 border-gray-300/60 py-1 pl-3 -translate-y-1/2">
        <CoordDisplay />
      </div>

      {/* Rotating globe */}
      <div className="absolute right-2 top-2 text-gray-400 animate-[spin_30s_linear_infinite]">
        <Globe className="h-6 w-6" strokeWidth={1.2} />
      </div>

      {/* Scene tag */}
      <div className="absolute bottom-2 right-4 text-[11px] text-gray-400 tracking-wider font-mono">
        //SCN_01
      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
