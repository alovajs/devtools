import {
  ArrowUpRight,
  Code2,
  Download,
  FileJson,
  FileText,
  Filter,
  Layers,
  Pencil,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Star,
  Terminal,
  Type,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { codeToHtml } from 'shiki'
import CommandBar from '@/components/CommandBar'
import FeatureCard from '@/components/FeatureCard'
import { HeroVisual, SceneTag, SectionHeader, SectionLabel } from '@/components/home/decors'
import { IDEExperienceTabs } from '@/components/home/ide-tabs'
import { RevealOnScroll } from '@/components/home/reveal-on-scroll'
import PluginCard from '@/components/PluginCard'
import { hoverDocsConfig, injectHoverTokens } from '@/lib/hover-docs'

/* ─── Post-process Shiki HTML: inject line numbers & force line-height ─── */
function injectShikiLineNumbers(html: string): string {
  let lineNum = 0
  return html.replace(
    /<span class="line"( style="[^"]*")?>/g,
    () => {
      lineNum++
      return `<span class="line" style="display:flex;line-height:1.25;min-height:1.25em"><span style="display:inline-block;flex-shrink:0;width:2em;margin-right:1.25rem;text-align:right;color:#6e7681;user-select:none">${lineNum}</span>`
    },
  )
}

/* ══════════════════════════════════════════
   Code snippets for Shiki pre-generation
   ══════════════════════════════════════════ */

const HOVER_CODE = `import { getPetById } from '@/api/services/pet'

const pet = await getPetById({ pathParams: { petId: 1 }})
`

const PORTAL_CODE_TOP = `import { getPetById } from '@/api/services/pet'

// Click below to view full API docs
`
const PORTAL_CODE_BOTTOM = `const pet = await getPetById({ pathParams: { petId: 1 }})

// View Api button above jumps to API Explorer tab
`

const QUICK_INSERT_CODE = `import { getPetById } from '@/api/services/pet'

getPetById({
  pathParams: {
    petId: 1
  }
})
`

/* ─── Section wrapper ─── */
function SectionWrap({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <section className={`relative px-8 py-28 lg:px-16 ${className}`}>{children}</section>
}

/* ─── Separator ─── */
function SectionDivider() {
  return <div className="mx-auto max-w-[1440px] px-8"><div className="via-brand-blue/15 h-px from-transparent to-transparent bg-gradient-to-r" /></div>
}

/* ─── Flow connector ─── */
function FlowConnector() {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      <div className="to-brand-blue/30 h-px w-12 rounded-full from-gray-300 bg-gradient-to-r" />
      <div className="bg-brand-blue h-2 w-2 rotate-45 rounded-sm" />
      <div className="to-brand-blue/30 h-px w-12 rounded-full from-gray-300 bg-gradient-to-l" />
    </div>
  )
}

/* ─── Artifact items ─── */
const artifacts = [
  { icon: <Code2 className="h-7 w-7" />, title: 'CODE', desc: 'Production-ready', gradient: 'from-blue-50 to-blue-100/50' },
  { icon: <Type className="h-7 w-7" />, title: 'TYPES', desc: 'Strongly-typed', gradient: 'from-emerald-50 to-emerald-100/50' },
  { icon: <FileText className="h-7 w-7" />, title: 'DOCS', desc: 'API documentation', gradient: 'from-amber-50 to-amber-100/50' },
  { icon: <Sparkles className="h-7 w-7" />, title: 'SKILL', desc: 'AI-ready knowledge', gradient: 'from-violet-50 to-violet-100/50' },
]

/** Server Component — 所有 Shiki 代码高亮在编译时生成，整个页面 SEO 友好 */
export default async function HomePage() {
  const theme = 'github-dark-default'
  const lang = 'typescript'

  // Hover docs: token → JSDoc mapping (configured in src/lib/hover-docs.ts)
  const hoverDocs = hoverDocsConfig
  const hoverTokens = new Set(Object.keys(hoverDocs))

  const [hoverCodeHtml, portalTopHtml, portalBottomHtml, quickInsertHtml] = await Promise.all([
    codeToHtml(HOVER_CODE, { lang, theme, defaultColor: false }).then(h => injectShikiLineNumbers(h)).then(h => injectHoverTokens(h, hoverTokens)),
    codeToHtml(PORTAL_CODE_TOP, { lang, theme, defaultColor: false }).then(h => injectShikiLineNumbers(h)).then(h => injectHoverTokens(h, hoverTokens)),
    codeToHtml(PORTAL_CODE_BOTTOM, { lang, theme, defaultColor: false }).then(h => injectShikiLineNumbers(h)).then(h => injectHoverTokens(h, hoverTokens)),
    codeToHtml(QUICK_INSERT_CODE, { lang, theme, defaultColor: false }).then(h => injectShikiLineNumbers(h)).then(h => injectHoverTokens(h, hoverTokens)),
  ])

  return (
    <div className="relative min-h-screen bg-white text-gray-900">
      {/* ══════════ TOP NAV ══════════ */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-8 py-4">
          <span className="text-lg text-gray-900 font-black tracking-[0.35em]">WORMA</span>
          <span className="hidden text-[10px] text-gray-500 tracking-[0.25em] font-mono md:block">· ONE SPEC, HUMAN TO AI.</span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-gray-400 tracking-[0.2em] font-mono uppercase">OPENAPI GENERATOR</span>
            <span className="text-brand-blue text-sm font-medium font-mono">/01</span>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-[1440px]">
        {/* ══════════ HERO ══════════ */}
        <section className="relative min-h-[85vh] overflow-hidden px-8 py-16 lg:py-0">
          <div className="absolute left-4 top-1/2 hidden lg:block -translate-y-1/2">
            <span className="text-brand-blue inline-block origin-center whitespace-nowrap text-[10px] font-medium tracking-[0.3em] font-mono" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              ONE SPEC · HUMAN TO AI
            </span>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:min-h-[85vh] lg:gap-4">
            <div className="flex flex-col gap-8 lg:col-span-5 lg:pl-16">
              <SectionLabel num="01" />
              {/* Char-reveal title: inline-block spans with staggered opacity transition via Tailwind arbitrary properties */}
              <h1 className="text-[56px] text-gray-900 font-black leading-[1.05] tracking-tight lg:text-[80px] sm:text-7xl">
                {('One spec, human to AI.').split('').map((ch, i) => (
                  <span key={i} className="inline-block" style={{ animation: `char-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards`, animationDelay: `${i * 40}ms`, opacity: 0, transform: 'translateY(60px)' }}>
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </h1>
              <p className="max-w-md text-base text-gray-500 leading-relaxed sm:text-lg" style={{ animation: 'fade-up 0.8s ease-out 0.4s both' }}>
                The OpenAPI generator for code and AI skill.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#" className="group bg-brand-blue shadow-brand-blue/20 hover:shadow-brand-blue/30 relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-7 py-3 text-sm text-white font-bold tracking-wide uppercase shadow-md transition-all duration-300 active:scale-[0.98] hover:shadow-lg hover:-translate-y-0.5" style={{ animation: 'fade-up 0.5s ease-out 0.9s both' }}>
                  <span className="absolute inset-0 from-transparent via-white/20 to-transparent bg-gradient-to-r transition-transform duration-700 -translate-x-full group-hover:translate-x-full" />
                  <span className="relative z-10">GET STARTED</span>
                  <ArrowUpRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a href="#" className="group hover:border-brand-blue hover:text-brand-blue inline-flex items-center gap-2 border border-gray-200 rounded-lg bg-white px-7 py-3 text-sm text-gray-700 font-bold tracking-wide uppercase shadow-sm transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5" style={{ animation: 'fade-up 0.5s ease-out 1.03s both' }}>
                  VIEW DOCS
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
              <div className="from-brand-blue/60 via-brand-blue/30 mt-4 h-1 w-24 rounded-full to-transparent bg-gradient-to-r" />
            </div>

            <div className="relative lg:col-span-7 lg:h-[85vh]">
              <div className="absolute left-0 top-6 z-20 flex flex-col gap-2">
                <SceneTag>
                  <span className="bg-brand-blue inline-block h-1 w-1 animate-pulse rounded-full" />
                  GENERATING
                </SceneTag>
                <SceneTag className="pl-4">
                  <span className="text-brand-blue font-bold">●</span>
                  {' '}
                  100%
                </SceneTag>
              </div>
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* ══════════ WHY CHOOSE WORMA ══════════ */}
        <RevealOnScroll>
          <SectionWrap>
            <div className="relative z-10">
              <SectionHeader num="02" title="Why Choose Worma" subtitle="One spec. Code, docs. AI skill." />
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="tilt-hover sm:row-span-2">
                  <FeatureCard icon={<Layers className="text-brand-blue h-8 w-8" />} title="4 Artifacts" desc="Code, types, docs, and AI skill - generated at once." large highlighted />
                </div>
                <div className="tilt-hover">
                  <FeatureCard icon={<Shapes className="text-brand-blue h-7 w-7" />} title="Universal Design" desc="Fit any tech stack. Extend with your rules." />
                </div>
                <div className="tilt-hover">
                  <FeatureCard icon={<SlidersHorizontal className="text-brand-blue h-7 w-7" />} title="Flexible & Controlled" desc="Customize what to generate, how, and for whom." />
                </div>
                <div className="tilt-hover sm:col-span-2">
                  <FeatureCard icon={<Terminal className="text-brand-blue h-7 w-7" />} title="IDE Friendly" desc="Works seamlessly in your favorite editor." />
                </div>
              </div>
            </div>
          </SectionWrap>
        </RevealOnScroll>

        <SectionDivider />

        {/* ══════════ BETTER IDE EXPERIENCE ══════════ */}
        <RevealOnScroll>
          <SectionWrap>
            <div className="relative z-10">
              <SectionHeader num="03" title="Better IDE Experience" subtitle="Built for developers. Loved by IDEs." />
              <IDEExperienceTabs hoverCodeHtml={hoverCodeHtml} portalTopHtml={portalTopHtml} portalBottomHtml={portalBottomHtml} quickInsertHtml={quickInsertHtml} hoverDocs={hoverDocs} />
            </div>
          </SectionWrap>
        </RevealOnScroll>

        <SectionDivider />

        {/* ══════════ FROM OPENAPI TO PRODUCTION ══════════ */}
        <SectionWrap>
          <RevealOnScroll>
            <SectionHeader num="04" title="From OpenAPI to Production" subtitle="One definition. Infinite possibilities." />
          </RevealOnScroll>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <RevealOnScroll delay={0.1} className="flex flex-col items-center gap-3">
              <div className="border-brand-blue/20 shadow-brand-blue/10 hover:shadow-brand-blue/15 h-20 w-20 flex items-center justify-center border rounded-2xl bg-white text-2xl text-gray-900 font-bold shadow-sm transition-shadow duration-300 hover:shadow-md">{'{ }'}</div>
              <div className="text-center">
                <p className="text-sm text-gray-900 font-bold tracking-wider">OpenAPI</p>
                <p className="text-[10px] text-gray-500 tracking-wider">YOUR INTERFACE</p>
                <p className="text-[10px] text-gray-400 tracking-wider">CONTRACT</p>
              </div>
            </RevealOnScroll>
            <FlowConnector />
            <RevealOnScroll delay={0.15} className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-0.5 text-2xl font-black tracking-[0.2em] transition-transform hover:scale-110">
                <span className="text-brand-blue">W</span>
                <span className="text-gray-400">O</span>
                <span className="text-brand-blue">R</span>
                <span className="text-gray-400">M</span>
                <span className="text-brand-blue">A</span>
              </div>
              <p className="text-[9px] text-gray-500 font-semibold tracking-[0.3em] uppercase">PROCESSING ENGINE</p>
            </RevealOnScroll>
            <FlowConnector />
            <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
              {artifacts.map((item, i) => (
                <RevealOnScroll key={item.title} delay={0.1 + i * 0.08}>
                  <div className={`flex flex-col items-center gap-3 border border-gray-200 bg-gradient-to-br ${item.gradient} hover:border-brand-blue/40 p-5 shadow-sm transition-all duration-300 first:rounded-l-xl last:rounded-r-xl hover:shadow-md`}>
                    <div className="text-brand-blue transition-transform duration-300 hover:scale-115">{item.icon}</div>
                    <div className="text-center">
                      <p className="text-lg text-gray-900 font-bold tracking-wider uppercase">{item.title}</p>
                      <p className="text-sm text-gray-500 tracking-wider">{item.desc}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </SectionWrap>

        <SectionDivider />

        {/* ══════════ PLUGIN CENTER ══════════ */}
        <RevealOnScroll>
          <SectionWrap>
            <div className="relative z-10">
              <SectionHeader num="05" title="Plugin Center" subtitle="Powerful plugins. Smarter generation." />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="tilt-hover"><PluginCard icon={<Pencil className="text-brand-blue h-7 w-7" />} title="rename" desc="Best rename for APIs, fields & params." /></div>
                <div className="tilt-hover lg:col-span-2"><PluginCard icon={<Filter className="text-brand-blue h-8 w-8" />} title="filterApi" desc="Filter APIs by tags. Generate what you need." large highlighted /></div>
                <div className="tilt-hover lg:col-span-2"><PluginCard icon={<Download className="text-brand-blue h-8 w-8" />} title="importType" desc="Import external types. Keep code clean." large highlighted /></div>
                <div className="tilt-hover"><PluginCard icon={<FileJson className="text-brand-blue h-7 w-7" />} title="aiDoc" desc="AI-provide docs and prompts." /></div>
              </div>
            </div>
          </SectionWrap>
        </RevealOnScroll>

        <SectionDivider />

        {/* ══════════ UNIVERSAL ADAPTER ══════════ */}
        <SectionWrap>
          <RevealOnScroll>
            <SectionHeader num="06" title="Universal Adapter" subtitle="Support mainstream tech stacks." />
          </RevealOnScroll>
          <div className="relative flex flex-col items-center gap-6 overflow-hidden border border-gray-200 rounded-2xl bg-white p-8 shadow-sm lg:p-10">
            <div className="bg-brand-blue/5 pointer-events-none absolute h-60 w-60 rounded-full blur-3xl -left-20 -top-20" />
            <div className="bg-brand-lime/10 pointer-events-none absolute h-60 w-60 rounded-full blur-3xl -bottom-20 -right-20" />

            {/* Labels above track */}
            <div className="relative z-10 flex w-full justify-between px-2">
              <span className="text-[11px] text-gray-400 font-medium tracking-[0.2em] uppercase">Backend</span>
              <span className="text-[11px] text-gray-400 font-medium tracking-[0.2em] uppercase">Frontend / HTTP Client</span>
            </div>

            {/* Row: Backend icons | Track SVG | Frontend icons — all h-14, vertically centered */}
            <div className="relative z-10 flex w-full items-center gap-4">
              {/* Backend */}
              <div className="flex shrink-0 flex-wrap justify-center gap-5">
                {[
                  { src: '/img/java.svg', alt: 'Java' },
                  { src: '/img/golang.svg', alt: 'Go' },
                  { src: '/img/Python.svg', alt: 'Python' },
                  { src: '/img/nodejs_alt.svg', alt: 'Node.js' },
                  { src: '/img/c-sharp.svg', alt: 'C#' },
                ].map(item => (
                  <div key={item.alt} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2 shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md">
                    <Image src={item.src} alt={item.alt} width={48} height={48} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>

              {/* Particle track SVG — fills remaining space, aligns with icons */}
              <svg className="h-14 flex-1 overflow-visible" viewBox="0 0 600 80">
                <defs>
                  <linearGradient id="track-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(5,0,255,0.25)" />
                    <stop offset="50%" stopColor="rgba(5,0,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(130,230,0,0.25)" />
                  </linearGradient>
                  <radialGradient id="glow-b" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0500ff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0500ff" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="glow-f" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#82e600" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#82e600" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Solid tracks */}
                <line x1="0" y1="28" x2="600" y2="28" stroke="url(#track-grad)" strokeWidth="1.5" />
                <line x1="0" y1="52" x2="600" y2="52" stroke="url(#track-grad)" strokeWidth="1.5" />
                {/* Center node */}
                <circle cx="300" cy="40" r="5" fill="rgba(5,0,255,0.2)" stroke="#0500ff" strokeWidth="1.5" style={{ animation: 'hub-pulse 2s ease-in-out infinite' }} />
                {/* Left particle on upper track */}
                <circle cx="4" cy="28" r="5" fill="url(#glow-b)" style={{ animation: 'particle-left 3s ease-in-out infinite' }} />
                {/* Right particle on lower track */}
                <circle cx="296" cy="52" r="5" fill="url(#glow-f)" style={{ animation: 'particle-right 3s ease-in-out infinite' }} />
              </svg>

              {/* Frontend */}
              <div className="flex shrink-0 flex-wrap justify-center gap-5">
                {[
                  { src: '/img/axios.svg', alt: 'Axios' },
                  { src: '/img/fetch.svg', alt: 'Fetch' },
                  { src: '/img/alova.svg', alt: 'Alova' },
                ].map(item => (
                  <div key={item.alt} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2 shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md">
                    <Image src={item.src} alt={item.alt} width={48} height={48} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Worma label below track */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <p className="text-sm text-gray-900 font-bold tracking-wider">Worma</p>
              <p className="text-[10px] text-gray-400 tracking-[0.3em] uppercase">UNIVERSAL ADAPTER</p>
            </div>
          </div>
        </SectionWrap>

        <SectionDivider />

        {/* ══════════ CTA ══════════ */}
        <SectionWrap>
          <RevealOnScroll>
            <div className="relative flex flex-col gap-10 overflow-hidden rounded-2xl from-slate-900 via-slate-900 to-slate-800 bg-gradient-to-br p-12 lg:flex-row lg:items-center">
              <div className="bg-brand-blue/10 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl -left-24 -top-24" />
              <div className="bg-brand-lime/5 pointer-events-none absolute h-80 w-80 rounded-full blur-3xl -bottom-24 -right-24" />
              <div className="relative z-10 flex flex-1 flex-col gap-6">
                <h2 className="text-3xl text-white font-black tracking-tighter">Ready to generate</h2>
                <p className="text-sm text-gray-400 tracking-wide">One spec is all it takes. Let WORMA do the rest.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="#" className="group bg-brand-blue shadow-brand-blue/30 relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-7 py-3 text-sm text-white font-bold tracking-wide uppercase shadow-lg transition-all duration-300 active:scale-[0.98] hover:scale-[1.02] hover:-translate-y-0.5">
                    <span className="absolute inset-0 from-transparent via-white/20 to-transparent bg-gradient-to-r transition-transform duration-700 -translate-x-full group-hover:translate-x-full" />
                    <span className="relative z-10">GET STARTED</span>
                    <ArrowUpRight className="relative z-10 h-5 w-5" />
                  </a>
                  <a href="#" className="hover:bg-white/10 inline-flex items-center gap-2 border border-white rounded-lg bg-transparent px-7 py-3 text-sm text-white font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] hover:scale-[1.02] hover:-translate-y-0.5">
                    VIEW DOCS
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                  <a href="#" className="hover:bg-white/10 inline-flex items-center gap-2 border border-white rounded-lg bg-transparent px-7 py-3 text-sm text-white font-bold tracking-wide uppercase transition-all duration-300 active:scale-[0.98] hover:scale-[1.02] hover:-translate-y-0.5">GITHUB</a>
                </div>
              </div>
              <div className="relative z-10 flex flex-1 items-center justify-end">
                <div className="relative flex flex-col items-end gap-3">
                  <SceneTag>
                    <span className="bg-brand-lime inline-block h-1 w-1 animate-pulse rounded-full" />
                    DEPLOYMENT READY
                  </SceneTag>
                  <SceneTag className="pl-4">
                    STATUS
                    <span className="text-brand-lime ml-1.5 font-bold">ACTIVE</span>
                  </SceneTag>
                  <SceneTag>
                    NODE
                    <span className="ml-1.5 text-gray-400">WORMA_PRD</span>
                  </SceneTag>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </SectionWrap>
      </main>

      {/* Pre-Footer Command Bar */}
      <RevealOnScroll><CommandBar /></RevealOnScroll>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-8 py-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1 text-lg text-gray-900 font-black tracking-[0.25em]">
                <span className="text-brand-blue">W</span>
                <span className="text-gray-400">O</span>
                <span className="text-brand-blue">R</span>
                <span className="text-gray-400">M</span>
                <span className="text-brand-blue">A</span>
              </div>
              <p className="text-xs text-gray-500 tracking-wider">One OpenAPI.</p>
              <p className="text-xs text-gray-500 tracking-wider">Infinite Possibilities.</p>
              <p className="text-[10px] text-gray-400 tracking-wider">&copy; 2025 WORMA. ALL RIGHTS RESERVED.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <span className="text-xs text-gray-900 font-bold tracking-wider uppercase">Product</span>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">HOMEPAGE</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">FEATURES</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">PRICING</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">CHANGELOG</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs text-gray-900 font-bold tracking-wider uppercase">Resources</span>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">DOCS</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">EXAMPLES</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">API REFERENCE</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">BLOG</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs text-gray-900 font-bold tracking-wider uppercase">Community</span>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">GITHUB</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">DISCORD</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">TWITTER</Link>
                <Link href="#" className="hover:text-brand-blue text-xs text-gray-500 tracking-wider transition-colors">VIDEO</Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="hover:border-brand-blue/30 flex items-center gap-2 border border-gray-200 rounded-lg bg-white px-4 py-2 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="animate-[spin_4s_ease-in-out_infinite]"><Star className="h-4 w-4 text-gray-700" /></div>
                <span className="text-xs text-gray-900 font-bold tracking-wider uppercase">GitHub Stars</span>
                <span className="text-xs text-gray-900 font-black tracking-wider">42,300</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Terminal status bar */}
      <div className="border-t border-gray-200 bg-black px-8 py-2">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between text-[10px] text-white tracking-wider">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="bg-brand-lime inline-block h-1.5 w-1.5 animate-pulse" />
              CONNECTION SECURE
            </span>
            <span className="hidden sm:inline">
              {'>'}
              {' '}
              ACCESS GRANTED_
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">NODE: CYBR_01</span>
            <span className="bg-brand-lime px-1.5 text-black font-bold">SCN: 0007</span>
          </div>
        </div>
      </div>
    </div>
  )
}
