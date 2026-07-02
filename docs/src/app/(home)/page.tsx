'use client'

import {
  ArrowUpRight,
  Code2,
  Download,
  FileJson,
  FileText,
  Filter,
  Globe,
  Layers,
  Pencil,
  Plus,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Star,
  Terminal,
  Type,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import CountingNumber from '@/components/CountingNumber'
import CommandBar from '@/components/CommandBar'
import CursorGlow from '@/components/CursorGlow'
import DecryptedText from '@/components/DecryptedText'
import FeatureCard from '@/components/FeatureCard'
import FrontendBadge from '@/components/FrontendBadge'
import IDECard from '@/components/IDECard'
import {
  PixelBranchIcon,
  PixelEyeIcon,
  PixelQuickInsertIcon,
  PixelSearchIcon,
  PixelSettingsIcon,
  PixelSparkleIcon,
} from '@/components/PixelIcons'
import PluginCard from '@/components/PluginCard'
import ScrollReveal from '@/components/ScrollReveal'
import SplitText from '@/components/SplitText'
import TechBadge from '@/components/TechBadge'
import TiltCard from '@/components/TiltCard'

/* ─── Decorative floating + symbols ─── */
function FloatingPlus({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      className={`absolute text-brand-blue/20 ${className}`}
      animate={{ y: [0, -8, 0], opacity: [0.15, 0.4, 0.15] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Plus className="h-5 w-5" strokeWidth={1.5} />
    </motion.span>
  )
}

/* ─── Dot grid background ─── */
function DotGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="#d1d5db" opacity="0.45" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  )
}

/* ─── Coordinate display ─── */
function CoordDisplay({ className = '' }: { className?: string }) {
  return (
    <div className={`font-mono text-[10px] tracking-wider text-gray-500 ${className}`}>
      <div>X_36.1749</div>
      <div>Y_-86.7676</div>
      <div>Z_46.6827</div>
    </div>
  )
}

/* ─── Scene tag ─── */
function SceneTag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-gray-400 uppercase ${className}`}>
      {children}
    </span>
  )
}

/* ─── Section label ─── */
function SectionLabel({ num, className = '' }: { num: string; className?: string }) {
  return (
    <motion.span
      className={`font-mono text-sm font-medium text-brand-blue ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      /{num}
    </motion.span>
  )
}

/* ─── Section header ─── */
function SectionHeader({
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
        <h2 className="text-2xl font-black tracking-tight text-gray-900">{title}</h2>
      </div>
      <p className="mb-14 ml-12 mt-1 text-sm tracking-wide text-gray-400">
        {subtitle}
      </p>
    </>
  )
}

/* ─── Hero 3D Letter Visual ─── */
function HeroVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <DotGrid className="opacity-60" />
      <FloatingPlus className="-top-4 left-[15%]" delay={0} />
      <FloatingPlus className="top-[20%] right-[8%]" delay={1.2} />
      <FloatingPlus className="bottom-[30%] left-[5%]" delay={0.6} />
      <FloatingPlus className="-bottom-2 right-[20%]" delay={1.8} />
      <FloatingPlus className="top-[55%] left-[25%]" delay={2.4} />
      <FloatingPlus className="top-[10%] left-[40%]" delay={3} />

      <motion.div
        className="absolute top-[18%] left-[22%] h-8 w-8 rounded-sm bg-brand-blue/30"
        animate={{ y: [0, -12, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[38%] right-[18%] h-6 w-6 rounded-sm bg-brand-lime/50"
        animate={{ y: [0, -10, 0], x: [0, 6, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-[28%] left-[28%] h-7 w-7 rounded-sm bg-brand-blue/25"
        animate={{ y: [0, -14, 0], rotate: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-[18%] right-[28%] h-9 w-9 rounded-sm bg-brand-blue/20"
        animate={{ y: [0, -8, 0], x: [0, -4, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute top-[62%] right-[35%] h-5 w-5 rounded-sm bg-brand-lime/60"
        animate={{ y: [0, -10, 0], rotate: [0, 25, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-[25%] right-[35%] h-6 w-6 rounded-sm bg-brand-blue/35"
        animate={{ y: [0, -16, 0], x: [0, 5, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      <motion.div
        className="relative z-10 select-none"
        initial={{ opacity: 0, scale: 0.85, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
          rotateY: { duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
        }}
      >
        <span
          className="block text-[180px] font-black leading-none [-webkit-text-stroke:2px_rgba(0,0,0,0.15)]"
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
        <div className="absolute inset-0 rounded bg-gradient-to-tr from-brand-blue/10 via-transparent to-transparent mix-blend-overlay" />
      </motion.div>

      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 border-l-2 border-gray-300/60 py-1 pl-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <CoordDisplay />
      </motion.div>

      <motion.div
        className="absolute right-2 top-2 text-gray-400"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, rotate: 360 }}
        transition={{
          opacity: { duration: 0.5, delay: 1 },
          scale: { duration: 0.5, delay: 1 },
          rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
        }}
      >
        <Globe className="h-6 w-6" strokeWidth={1.2} />
      </motion.div>

      <motion.div
        className="absolute bottom-2 right-4 font-mono text-[11px] tracking-wider text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        //SCN_01
      </motion.div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-white text-gray-900">
      <CursorGlow />

      {/* ══════════ TOP NAV BAR ══════════ */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md transition-shadow duration-300">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
          <motion.span
            className="text-lg font-black tracking-[0.35em] text-gray-900"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            WORMA
          </motion.span>
          <span className="hidden font-mono text-[10px] tracking-[0.25em] text-gray-500 md:block">
            · ONE SPEC, HUMAN TO AI.
          </span>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase">
              OPENAPI GENERATOR
            </span>
            <span className="font-mono text-sm font-medium text-brand-blue">/01</span>
          </motion.div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-[1440px]">
        {/* ══════════ HERO ══════════ */}
        <section className="relative min-h-[85vh] overflow-hidden px-8 py-16 lg:py-0">
          <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 lg:block">
            <motion.span
              className="inline-block origin-center whitespace-nowrap font-mono text-[10px] font-medium tracking-[0.3em]"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              initial={{ opacity: 0, color: '#d1d5db' }}
              animate={{ opacity: 1, color: '#0500ff' }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              ONE SPEC · HUMAN TO AI
            </motion.span>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-4 lg:min-h-[85vh]">
            <div className="flex flex-col gap-8 lg:col-span-5 lg:pl-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SectionLabel num="01" />
              </motion.div>
              <SplitText
                tag="h1"
                text="One spec, human to AI."
                className="text-[56px] font-black leading-[1.05] tracking-tight text-gray-900 sm:text-7xl lg:text-[80px]"
                delay={40}
                duration={1.2}
                ease="power3.out"
                splitType="words, chars"
                from={{ opacity: 0, y: 60 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-50px"
                textAlign="left"
              />
              <DecryptedText
                text="The OpenAPI generator for code and AI skill."
                animateOn="view"
                sequential
                revealDirection="start"
                speed={60}
                maxIterations={8}
                className="max-w-md text-base leading-relaxed text-gray-500 sm:text-lg"
                parentClassName="max-w-md text-base leading-relaxed text-gray-500 sm:text-lg"
              />
              <motion.div
                className="flex flex-wrap items-center gap-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.9 } },
                }}
              >
                <motion.a
                  href="#"
                  className="bg-brand-blue group relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-7 py-3 text-sm font-bold tracking-wide text-white uppercase transition-all duration-300 hover:shadow-lg hover:shadow-brand-blue/25 active:scale-[0.98]"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative z-10">GET STARTED</span>
                  <ArrowUpRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.a>
                <motion.a
                  href="#"
                  className="hover:border-brand-blue hover:text-brand-blue group inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-7 py-3 text-sm font-bold tracking-wide text-gray-700 uppercase transition-all duration-300 active:scale-[0.98]"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
                  }}
                >
                  VIEW DOCS
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.a>
              </motion.div>
            </div>

            <div className="relative lg:col-span-7 lg:h-[85vh]">
              <div className="absolute left-0 top-6 z-20 flex flex-col gap-2">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <SceneTag>
                    <motion.span
                      className="inline-block h-1 w-1 rounded-full bg-brand-blue"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    GENERATING
                  </SceneTag>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.65 }}
                >
                  <SceneTag className="pl-4">
                    <span className="font-bold text-brand-blue">●</span> 100%
                  </SceneTag>
                </motion.div>
              </div>
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* ══════════ WHY CHOOSE WORMA — Bento 3+1 ══════════ */}
        <ScrollReveal className="relative px-8 py-28 lg:px-16" direction="up">
          <SectionHeader num="02" title="Why Choose Worma" subtitle="One spec. Code, docs. AI skill." />

          {/* Bento: 2-col, tall left hero + 2 stacked right + full-width bottom */}
          <div className="grid gap-6 sm:grid-cols-2">
            <TiltCard maxTilt={3} className="sm:row-span-2">
              <FeatureCard
                icon={<Layers className="h-8 w-8 text-brand-blue" />}
                title="4 Artifacts"
                desc="Code, types, docs, and AI skill—generated at once."
                large
                highlighted
              />
            </TiltCard>
            <TiltCard maxTilt={3}>
              <FeatureCard
                icon={<Shapes className="h-7 w-7 text-brand-blue" />}
                title="Universal Design"
                desc="Fit any tech stack. Extend with your rules."
              />
            </TiltCard>
            <TiltCard maxTilt={3}>
              <FeatureCard
                icon={<SlidersHorizontal className="h-7 w-7 text-brand-blue" />}
                title="Flexible & Controlled"
                desc="Customize what to generate, how, and for whom."
              />
            </TiltCard>
            <TiltCard maxTilt={3} className="sm:col-span-2">
              <FeatureCard
                icon={<Terminal className="h-7 w-7 text-brand-blue" />}
                title="IDE Friendly"
                desc="Works seamlessly in your favorite editor."
              />
            </TiltCard>
          </div>
        </ScrollReveal>

        {/* ══════════ FROM OPENAPI TO PRODUCTION ══════════ */}
        <section className="relative px-8 py-28 lg:px-16">
          <ScrollReveal direction="up">
            <SectionHeader num="03" title="From OpenAPI to Production" subtitle="One definition. Infinite possibilities." />
          </ScrollReveal>

          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <ScrollReveal direction="left" distance={30} className="flex flex-col items-center gap-3" delay={0.1}>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-white text-2xl font-bold text-gray-900 shadow-sm transition-shadow duration-300 hover:shadow-md">
                {'{ }'}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold tracking-wider text-gray-900">OpenAPI</p>
                <p className="text-[10px] tracking-wider text-gray-500">YOUR INTERFACE</p>
                <p className="text-[10px] tracking-wider text-gray-400">CONTRACT</p>
              </div>
            </ScrollReveal>

            <div className="hidden lg:block">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="h-px w-16 bg-gray-300" />
                <div className="h-2 w-2 bg-brand-blue" />
                <div className="h-px w-16 bg-gray-300" />
              </motion.div>
            </div>

            <ScrollReveal direction="up" distance={20} className="flex flex-col items-center gap-2" delay={0.15}>
              <motion.div
                className="flex items-center gap-0.5 text-2xl font-black tracking-[0.2em]"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <span className="text-brand-blue">W</span>
                <span className="text-gray-400">O</span>
                <span className="text-brand-blue">R</span>
                <span className="text-gray-400">M</span>
                <span className="text-brand-blue">A</span>
              </motion.div>
              <p className="text-[9px] font-semibold tracking-[0.3em] text-gray-500 uppercase">PROCESSING ENGINE</p>
            </ScrollReveal>

            <div className="hidden lg:block">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="h-px w-16 bg-gray-300" />
                <div className="h-2 w-2 bg-brand-blue" />
                <div className="h-px w-16 bg-gray-300" />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
              {[
                { icon: <Code2 className="h-7 w-7" />, title: 'CODE', desc: 'Production-ready' },
                { icon: <Type className="h-7 w-7" />, title: 'TYPES', desc: 'Strongly-typed' },
                { icon: <FileText className="h-7 w-7" />, title: 'DOCS', desc: 'API documentation' },
                { icon: <Sparkles className="h-7 w-7" />, title: 'SKILL', desc: 'AI-ready knowledge' },
              ].map((item, i) => (
                <ScrollReveal key={item.title} direction="right" distance={24} delay={0.1 + i * 0.08}>
                  <div className="flex flex-col items-center gap-3 border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-brand-blue/40 hover:shadow-md first:rounded-l-xl last:rounded-r-xl">
                    <motion.div
                      className="text-brand-blue"
                      whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {item.icon}
                    </motion.div>
                    <div className="text-center">
                      <p className="text-lg font-bold tracking-wider text-gray-900 uppercase">{item.title}</p>
                      <p className="text-sm tracking-wider text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ PLUGIN CENTER — Bento 1-2-1 ══════════ */}
        <ScrollReveal className="relative px-8 py-28 lg:px-16" direction="up">
          <SectionHeader num="04" title="Plugin Center" subtitle="Powerful plugins. Smarter generation." />

          {/* Bento: 3-col, wide-narrow-wide rhythm */}
          <div className="grid gap-6 lg:grid-cols-3">
            <TiltCard maxTilt={4}>
              <PluginCard
                icon={<Pencil className="h-7 w-7 text-brand-blue" />}
                title="rename"
                desc="Best rename for APIs, fields & params."
              />
            </TiltCard>
            <div className="lg:col-span-2">
              <TiltCard maxTilt={3}>
                <PluginCard
                  icon={<Filter className="h-8 w-8 text-brand-blue" />}
                  title="filterApi"
                  desc="Filter APIs by tags. Generate what you need."
                  large
                  highlighted
                />
              </TiltCard>
            </div>
            <div className="lg:col-span-2">
              <TiltCard maxTilt={3}>
                <PluginCard
                  icon={<Download className="h-8 w-8 text-brand-blue" />}
                  title="importType"
                  desc="Import external types. Keep code clean."
                  large
                  highlighted
                />
              </TiltCard>
            </div>
            <TiltCard maxTilt={4}>
              <PluginCard
                icon={<FileJson className="h-7 w-7 text-brand-blue" />}
                title="aiDoc"
                desc="AI-provide docs and prompts."
              />
            </TiltCard>
          </div>
        </ScrollReveal>

        {/* ══════════ UNIVERSAL ADAPTER ══════════ */}
        <section className="relative px-8 py-28 lg:px-16">
          <ScrollReveal direction="up">
            <SectionHeader num="05" title="Universal Adapter" subtitle="Support mainstream tech stacks." />
          </ScrollReveal>

          <motion.div
            className="flex flex-col items-center gap-12 rounded-2xl border border-gray-200 bg-white p-10 shadow-sm lg:flex-row lg:justify-between"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col items-center gap-5">
              <span className="text-[11px] font-medium tracking-wider text-gray-500 uppercase">Backend</span>
              <div className="flex flex-wrap justify-center gap-3">
                <TechBadge name="Java" color="#e76f00" />
                <TechBadge name="Go" color="#00add8" />
                <TechBadge name="Python" color="#3776ab" />
                <TechBadge name="Node.js" color="#339933" />
                <TechBadge name="C#" color="#68217a" />
              </div>
            </div>

            <motion.div
              className="flex flex-col items-center gap-2"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-blue text-2xl font-black text-white"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                W
              </motion.div>
              <p className="text-xs font-bold tracking-wider text-gray-900">Worma</p>
              <p className="text-[9px] tracking-[0.3em] text-gray-500 uppercase">UNIVERSAL ADAPTER</p>
            </motion.div>

            <div className="flex flex-col items-center gap-5">
              <span className="text-[11px] font-medium tracking-wider text-gray-500 uppercase">Frontend / HTTP Client</span>
              <div className="flex flex-wrap justify-center gap-3">
                <FrontendBadge name="Axios" color="#5a29e4" />
                <FrontendBadge name="Fetch" color="#f7df1e" />
                <FrontendBadge name="Ky" color="#222" />
                <FrontendBadge name="Alova" color="#00b4ff" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════ BETTER IDE EXPERIENCE — Bento 2-1-1 / 1-1-2 ══════════ */}
        <ScrollReveal className="relative px-8 py-28 lg:px-16" direction="up">
          <SectionHeader num="06" title="Better IDE Experience" subtitle="Built for developers. Loved by IDEs." />

          {/* Bento: 3-col staggered — 2-col hero row → 3-col row → full-width highlight */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TiltCard maxTilt={3} className="lg:col-span-2">
              <IDECard
                icon={<PixelBranchIcon />}
                title="API Explorer"
                desc="Explore your API endpoints visually."
                large
                highlighted
              />
            </TiltCard>
            <TiltCard maxTilt={5} scale={1.015}>
              <IDECard icon={<PixelEyeIcon />} title="Hover Docs" desc="Instant API docs on hover." />
            </TiltCard>
            <TiltCard maxTilt={5} scale={1.015}>
              <IDECard icon={<PixelQuickInsertIcon />} title="Quick Insert" desc="Insert API calls with one click." />
            </TiltCard>
            <TiltCard maxTilt={5} scale={1.015}>
              <IDECard icon={<PixelSettingsIcon />} title="Portal" desc="All-in-one API management." />
            </TiltCard>
            <TiltCard maxTilt={5} scale={1.015}>
              <IDECard icon={<PixelSearchIcon />} title="Auto Detect" desc="Detect OpenAPI files automatically." />
            </TiltCard>
            <TiltCard maxTilt={3} className="lg:col-span-3">
              <IDECard
                icon={<PixelSparkleIcon />}
                title="JS IntelliSense"
                desc="Smart suggestions for API usage."
                large
                highlighted
              />
            </TiltCard>
          </div>
        </ScrollReveal>

        {/* ══════════ READY TO GENERATE (CTA) ══════════ */}
        <section className="relative px-8 py-28 lg:px-16">
          <motion.div
            className="flex flex-col gap-10 lg:flex-row lg:items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-1 flex-col gap-6">
              <motion.h2
                className="text-3xl font-black tracking-tighter text-gray-900"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Ready to generate
              </motion.h2>
              <motion.p
                className="text-sm tracking-wide text-gray-500"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                One spec is all it takes. Let WORMA do the rest.
              </motion.p>
              <div className="flex flex-wrap items-center gap-3">
                <motion.a
                  href="#"
                  className="bg-brand-blue group relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-7 py-3 text-sm font-bold tracking-wide text-white uppercase transition-all duration-300 hover:shadow-lg hover:shadow-brand-blue/25 active:scale-[0.98]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative z-10">GET STARTED</span>
                  <ArrowUpRight className="relative z-10 h-5 w-5" />
                </motion.a>
                <motion.a
                  href="#"
                  className="hover:border-brand-blue hover:text-brand-blue inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-7 py-3 text-sm font-bold tracking-wide text-gray-700 uppercase transition-all duration-300 active:scale-[0.98]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  VIEW DOCS
                  <ArrowUpRight className="h-5 w-5" />
                </motion.a>
                <motion.a
                  href="#"
                  className="hover:border-brand-blue hover:text-brand-blue inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-7 py-3 text-sm font-bold tracking-wide text-gray-700 uppercase transition-all duration-300 active:scale-[0.98]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  GITHUB
                </motion.a>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end">
              <div className="relative flex flex-col items-end gap-3">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <SceneTag>
                    <motion.span
                      className="inline-block h-1 w-1 rounded-full bg-brand-lime"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    DEPLOYMENT READY
                  </SceneTag>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <SceneTag className="pl-4">
                    STATUS<span className="ml-1.5 font-bold text-brand-lime">ACTIVE</span>
                  </SceneTag>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <SceneTag>
                    NODE<span className="ml-1.5 text-gray-600">WORMA_PRD</span>
                  </SceneTag>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Pre-Footer Command Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <CommandBar />
      </motion.div>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-8 py-12">
          <motion.div
            className="flex flex-col gap-10 lg:flex-row lg:justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-1 text-lg font-black tracking-[0.25em] text-gray-900">
                <span className="text-brand-blue">W</span>
                <span className="text-gray-400">O</span>
                <span className="text-brand-blue">R</span>
                <span className="text-gray-400">M</span>
                <span className="text-brand-blue">A</span>
              </div>
              <p className="text-xs tracking-wider text-gray-500">One OpenAPI.</p>
              <p className="text-xs tracking-wider text-gray-500">Infinite Possibilities.</p>
              <p className="text-[10px] tracking-wider text-gray-400">&copy; 2025 WORMA. ALL RIGHTS RESERVED.</p>
            </motion.div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-wider text-gray-900 uppercase">Product</span>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">HOMEPAGE</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">FEATURES</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">PRICING</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">CHANGELOG</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-wider text-gray-900 uppercase">Resources</span>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">DOCS</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">EXAMPLES</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">API REFERENCE</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">BLOG</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-wider text-gray-900 uppercase">Community</span>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">GITHUB</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">DISCORD</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">TWITTER</Link>
                <Link href="#" className="text-xs tracking-wider text-gray-500 transition-colors duration-200 hover:text-brand-blue">VIDEO</Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm transition-all duration-300 hover:border-brand-blue/30 hover:shadow-md">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Star className="h-4 w-4 text-gray-700" />
                </motion.div>
                <span className="text-xs font-bold tracking-wider text-gray-900 uppercase">GitHub Stars</span>
                <CountingNumber value={42300} duration={2.5} className="text-xs font-black tracking-wider text-gray-900" />
              </div>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Terminal status bar */}
      <motion.div
        className="border-t border-gray-200 bg-black px-8 py-2"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between text-[10px] tracking-wider text-white">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse bg-brand-lime" />
              CONNECTION SECURE
            </span>
            <span className="hidden sm:inline">{'>'} ACCESS GRANTED_</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">NODE: CYBR_01</span>
            <span className="bg-brand-lime px-1.5 font-bold text-black">SCN: 0007</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
