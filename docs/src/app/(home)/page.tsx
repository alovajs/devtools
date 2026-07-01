import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import CommandBar from '@/components/CommandBar'
import Crosshair from '@/components/Crosshair'
import CyberFlowLine from '@/components/CyberFlowLine'
import DotGrid from '@/components/DotGrid'
import DoubleCross from '@/components/DoubleCross'
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
import SceneTag from '@/components/SceneTag'
import SectionDivider from '@/components/SectionDivider'
import SectionLabel from '@/components/SectionLabel'
import SectionNum from '@/components/SectionNum'
import SmallSparkle from '@/components/SmallSparkle'
import SystemStatusBar from '@/components/SystemStatusBar'
import TechBadge from '@/components/TechBadge'

const themeBlue = '#0500ff'
const accentLime = '#d4ff00'

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-white font-sans text-gray-900">
      <DotGrid />

      {/* System Status Bar */}
      <SystemStatusBar />

      {/* ===== Nav ===== */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1 font-mono text-lg font-black tracking-[0.25em] text-gray-900">
              <span className="text-[#0500ff]">W</span>
              <span className="text-gray-400">O</span>
              <span className="text-[#0500ff]">R</span>
              <span className="text-gray-400">M</span>
              <span className="text-[#0500ff]">A</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <div
                className="h-1.5 w-1.5"
                style={{ backgroundColor: themeBlue }}
              />
              <span className="font-mono text-[11px] tracking-wider text-gray-500">
                ONE SPEC, HUMAN TO AI.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[10px] tracking-wider text-gray-500 sm:inline">
              USER CONSOLE
            </span>
            <div className="flex h-8 w-8 items-center justify-center border border-gray-300 font-mono text-xs font-bold text-gray-700">
              HS
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ===== Section 01: Hero ===== */}
        <section className="relative py-20 lg:py-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            {/* Left side labels */}
            <div className="hidden flex-col items-center gap-6 lg:flex">
              <SectionNum num="01" />
              <div className="flex-1" />
              <div className="flex flex-col items-center gap-2">
                <div className="h-1 w-1 bg-gray-400" />
                <div className="h-1 w-1 bg-gray-400" />
                <div className="h-1 w-1 bg-gray-400" />
                <div className="h-1 w-1 bg-gray-300" />
              </div>
              <div className="flex-1" />
              <SectionLabel>SPEC → CODE → AI SKILL</SectionLabel>
            </div>

            <div className="flex flex-1 flex-col gap-6">
              <div className="lg:hidden">
                <SectionNum num="01" />
              </div>
              <h1 className="font-sans text-6xl font-black uppercase leading-[0.82] tracking-tighter text-black sm:text-7xl lg:text-9xl">
                One spec,
                <br />
                human to{' '}
                <span
                  className="text-black"
                  style={{ backgroundColor: accentLime }}
                >
                  AI.
                </span>
              </h1>
              <p className="max-w-lg font-mono text-xs uppercase tracking-[0.3em] text-gray-500 lg:text-sm">
                The OpenAPI generator
                <br />
                for code and AI skill.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-3 border border-[#0500ff] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90"
                  style={{ backgroundColor: themeBlue }}
                >
                  GET STARTED
                  <ArrowUpRight className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-3 border border-gray-300 bg-white px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-gray-700 transition hover:border-[#0500ff] hover:text-[#0500ff]"
                >
                  VIEW DOCS
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Right: Hero image with cyber decorations */}
            <div className="flex flex-1 items-center justify-center">
                <div className="relative">
                  {/* Corner ticks */}
                  <span className="absolute -left-1 -top-1 h-2.5 w-2.5 border-l border-t border-gray-400" />
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 border-r border-t border-gray-400" />
                  <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b border-l border-gray-400" />
                  <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b border-r border-gray-400" />
                  {/* Mid-edge ticks */}
                  <span className="absolute left-1/2 -top-1 h-1.5 w-px -translate-x-1/2 bg-gray-400" />
                  <span className="absolute left-1/2 -bottom-1 h-1.5 w-px -translate-x-1/2 bg-gray-400" />
                  {/* Scan label top-right */}
                  <span
                    className="absolute right-3 top-3 font-mono text-[9px] font-bold tracking-wider text-black"
                    style={{ backgroundColor: accentLime }}
                  >
                    {' '}
                    SCN_01{' '}
                  </span>
                  {/* Progress bar bottom */}
                  <div className="absolute -bottom-8 left-0 right-0">
                    <div className="flex items-center justify-between font-mono text-[9px] tracking-wider text-gray-500">
                      <span>RENDERING</span>
                      <span>83%</span>
                    </div>
                    <div className="mt-1 h-px w-full bg-gray-200">
                      <div
                        className="h-full"
                        style={{ width: '83%', backgroundColor: themeBlue }}
                      />
                    </div>
                  </div>

                  <div className="flex h-72 w-72 items-center justify-center border border-gray-300 bg-gray-50 lg:h-[480px] lg:w-[480px] sm:h-96 sm:w-96">
                    <div className="font-mono text-xs tracking-wider text-gray-400">
                      HERO IMAGE
                    </div>
                    <div className="absolute right-4 top-10">
                      <SmallSparkle />
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ===== Section 02: Why Choose WORMA ===== */}
        <section className="py-20 lg:py-28">
          <div className="flex items-start gap-4">
            <div className="hidden flex-col gap-4 lg:flex">
              <SectionNum num="02" />
            </div>
            <div className="flex-1">
              <div className="mb-2 lg:hidden">
                <SectionNum num="02" />
              </div>
              <h2 className="flex items-center gap-3 font-sans text-xl font-black uppercase tracking-tight text-gray-900 lg:text-2xl">
                Why Choose WORMA
                <DoubleCross />
              </h2>
              <p className="mb-14 mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
                One spec. Code, Docs. AI Skill.
              </p>
              <div className="mb-10 flex items-center gap-2">
                <span className="h-px w-8 bg-gray-300" />
                <span className="h-1 w-1 bg-[#0500ff]" />
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <FeatureCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M15 5L24 9.5V19.5L15 24L6 19.5V9.5L15 5Z" />
                      <path d="M15 5V15" />
                      <path d="M15 15L24 9.5" />
                      <path d="M15 15L6 9.5" />
                      <path d="M6 9.5L15 24" strokeDasharray="1.5 1.5" />
                      <path d="M24 9.5L15 24" strokeDasharray="1.5 1.5" />
                      <circle cx="15" cy="15" r="2" fill="#0500ff" stroke="none" />
                    </svg>
                  )}
                  title="4 Artifacts"
                  desc="Code, types, docs, and AI skill—generated at once."
                />
                <FeatureCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="4" y="4" width="15" height="15" />
                      <rect x="11" y="11" width="15" height="15" />
                      <path d="M4 19h7v7" />
                      <circle cx="12.5" cy="9" r="1" fill="#0500ff" stroke="none" />
                      <circle cx="17.5" cy="14" r="1" fill="#0500ff" stroke="none" />
                    </svg>
                  )}
                  title="Universal Design"
                  desc="Fit any tech stack. Extend with your rules."
                />
                <FeatureCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M4 10h22" />
                      <path d="M4 20h22" />
                      <circle cx="9" cy="10" r="2.5" />
                      <circle cx="21" cy="20" r="2.5" />
                      <path d="M9 12.5V17.5" stroke="#0500ff" />
                      <path d="M21 17.5V12.5" stroke="#0500ff" />
                    </svg>
                  )}
                  title="Flexible & Controlled"
                  desc="Customize what to generate, how, and for whom."
                />
                <FeatureCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="6" y="4" width="18" height="22" />
                      <line x1="10" y1="10" x2="20" y2="10" />
                      <line x1="10" y1="14" x2="20" y2="14" />
                      <line x1="10" y1="18" x2="17" y2="18" />
                      <line x1="10" y1="22" x2="15" y2="22" />
                      <circle cx="11" cy="8" r="1" fill="#0500ff" stroke="none" />
                      <circle cx="14" cy="8" r="1" fill="#0500ff" stroke="none" />
                    </svg>
                  )}
                  title="IDE Friendly"
                  desc="Works seamlessly in your favorite editor."
                />
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ===== Section 03: From OpenAPI to Production ===== */}
        <section className="py-20 lg:py-28">
          <div className="flex items-start gap-4">
            <div className="hidden flex-col gap-4 lg:flex">
              <SectionNum num="03" />
            </div>
            <div className="flex-1">
              <div className="mb-2 lg:hidden">
                <SectionNum num="03" />
              </div>
              <h2 className="flex items-center gap-3 font-sans text-xl font-black uppercase tracking-tight text-gray-900 lg:text-2xl">
                From OpenAPI to Production
                <DoubleCross />
              </h2>
              <p className="mb-16 mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
                One definition. Infinite possibilities.
              </p>
              <div className="mb-10 flex items-center gap-2">
                <span className="h-px w-8 bg-gray-300" />
                <span className="h-1 w-1 bg-[#0500ff]" />
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
                {/* OpenAPI */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center border border-gray-300 bg-white font-mono text-2xl font-bold text-black">
                    {'{ }'}
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900">
                      OpenAPI
                    </div>
                    <div className="font-mono text-[10px] tracking-wider text-gray-500">
                      YOUR INTERFACE
                    </div>
                    <div className="font-mono text-[10px] tracking-wider text-gray-400">
                      CONTRACT
                    </div>
                  </div>
                </div>

                <CyberFlowLine />

                {/* WORMA Engine */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1 font-mono text-2xl font-black tracking-[0.2em] text-gray-900">
                    <span className="text-[#0500ff]">W</span>
                    <span className="text-gray-400">O</span>
                    <span className="text-[#0500ff]">R</span>
                    <span className="text-gray-400">M</span>
                    <span className="text-[#0500ff]">A</span>
                  </div>
                  <div className="font-mono text-[9px] font-semibold tracking-[0.3em] text-gray-500">
                    PROCESSING ENGINE
                  </div>
                </div>

                <CyberFlowLine />

                {/* Outputs */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { icon: (
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <polyline points="8 11 4 15 8 19" />
                        <polyline points="22 11 26 15 22 19" />
                        <line x1="17" y1="7" x2="13" y2="23" stroke="#0500ff" />
                      </svg>
                    ), title: 'CODE', desc: 'Production-ready' },
                    { icon: (
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="5" y="5" width="20" height="20" />
                        <text x="15" y="20" textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="700" fill="#0500ff" stroke="none">T</text>
                      </svg>
                    ), title: 'TYPES', desc: 'Strongly-typed' },
                    { icon: (
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M7 4h12l4 4v18H7z" />
                        <path d="M19 4v4h4" />
                        <line x1="10" y1="13" x2="20" y2="13" stroke="#0500ff" />
                        <line x1="10" y1="17" x2="20" y2="17" stroke="#0500ff" />
                        <line x1="10" y1="21" x2="16" y2="21" stroke="#0500ff" />
                      </svg>
                    ), title: 'DOCS', desc: 'API documentation' },
                    { icon: (
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M15 4l2.5 6.5L24 11l-5 4.5L20.5 23L15 19l-5.5 4L11 15.5L6 11l6.5-.5z" />
                        <circle cx="15" cy="13" r="1.5" fill="#0500ff" stroke="none" />
                      </svg>
                    ), title: 'SKILL', desc: 'AI-ready knowledge' },
                  ].map(item => (
                    <div
                      key={item.title}
                      className="flex flex-col items-center gap-3 border border-gray-300 bg-white p-5 transition hover:border-[#0500ff]"
                    >
                      <div className="text-gray-900">
                        {item.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900">
                          {item.title}
                        </div>
                        <div className="font-mono text-[9px] tracking-wider text-gray-500">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ===== Section 04: Plugin Center ===== */}
        <section className="py-20 lg:py-28">
          <div className="flex items-start gap-4">
            <div className="hidden flex-col gap-4 lg:flex">
              <SectionNum num="04" />
            </div>
            <div className="flex-1">
              <div className="mb-2 lg:hidden">
                <SectionNum num="04" />
              </div>
              <h2 className="flex items-center gap-3 font-sans text-xl font-black uppercase tracking-tight text-gray-900 lg:text-2xl">
                Plugin Center
                <DoubleCross />
              </h2>
              <p className="mb-14 mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
                Powerful plugins. Smarter generation.
              </p>
              <div className="mb-10 flex items-center gap-2">
                <span className="h-px w-8 bg-gray-300" />
                <span className="h-1 w-1 bg-[#0500ff]" />
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <PluginCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4a3.5 3.5 0 1 1 5 5L9 26 3 28l2-6z" />
                      <path d="m19 6 5 5" />
                      <circle cx="7" cy="23" r="1.2" fill="#0500ff" stroke="none" />
                    </svg>
                  )}
                  title="rename"
                  desc="Best rename for APIs, fields & params."
                />
                <PluginCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="27 4 3 4 12 14 12 24 18 26 18 14 27 4" />
                      <circle cx="9" cy="9" r="1.2" fill="#0500ff" stroke="none" />
                    </svg>
                  )}
                  title="filterApi"
                  desc="Filter APIs by tags. Generate what you need."
                />
                <PluginCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M26 19v5a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 4 24v-5" />
                      <polyline points="9 12 15 18 21 12" />
                      <line x1="15" y1="18" x2="15" y2="3" stroke="#0500ff" />
                    </svg>
                  )}
                  title="importType"
                  desc="Import external types. Keep code clean."
                />
                <PluginCard
                  icon={(
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 2H7a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8z" />
                      <path d="M18 2v5a2 2 0 0 0 2 2h5" />
                      <circle cx="11" cy="14" r="1.2" fill="#0500ff" stroke="none" />
                      <line x1="14" y1="14" x2="20" y2="14" stroke="#0500ff" />
                    </svg>
                  )}
                  title="aiDoc"
                  desc="AI-provide docs and prompts."
                />
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ===== Section 05: Universal Adapter ===== */}
        <section className="py-20 lg:py-28">
          <div className="flex items-start gap-4">
            <div className="hidden flex-col gap-4 lg:flex">
              <SectionNum num="05" />
            </div>
            <div className="flex-1">
              <div className="mb-2 lg:hidden">
                <SectionNum num="05" />
              </div>
              <h2 className="flex items-center gap-3 font-sans text-xl font-black uppercase tracking-tight text-gray-900 lg:text-2xl">
                Universal Adapter
                <DoubleCross />
              </h2>
              <p className="mb-14 mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
                Support mainstream tech stacks.
              </p>
              <div className="mb-10 flex items-center gap-2">
                <span className="h-px w-8 bg-gray-300" />
                <span className="h-1 w-1 bg-[#0500ff]" />
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex flex-col items-center gap-8 border border-gray-300 bg-white p-10 lg:flex-row lg:justify-between">
                {/* Backend */}
                <div className="flex flex-col items-center gap-5">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Backend
                  </span>
                  <div className="flex flex-wrap justify-center gap-3">
                    <TechBadge name="Java" color="#e76f00" />
                    <TechBadge name="Go" color="#00add8" />
                    <TechBadge name="Python" color="#3776ab" />
                    <TechBadge name="Node.js" color="#339933" />
                    <TechBadge name="C#" color="#68217a" />
                  </div>
                </div>

                {/* Center WORMA */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-16 w-16 items-center justify-center font-mono text-2xl font-black text-white"
                    style={{ backgroundColor: themeBlue }}
                  >
                    W
                  </div>
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900">
                    WORMA
                  </div>
                  <div className="font-mono text-[9px] tracking-[0.3em] text-gray-500">
                    UNIVERSAL ADAPTER
                  </div>
                </div>

                {/* Frontend */}
                <div className="flex flex-col items-center gap-5">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Frontend / HTTP Client
                  </span>
                  <div className="flex flex-wrap justify-center gap-3">
                    <FrontendBadge name="Axios" color="#5a29e4" />
                    <FrontendBadge name="Fetch" color="#f7df1e" />
                    <FrontendBadge name="Ky" color="#222" />
                    <FrontendBadge name="Alova" color="#00b4ff" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ===== Section 06: Better IDE Experience ===== */}
        <section className="py-20 lg:py-28">
          <div className="flex items-start gap-4">
            <div className="hidden flex-col gap-4 lg:flex">
              <SectionNum num="06" />
            </div>
            <div className="flex-1">
              <div className="mb-2 lg:hidden">
                <SectionNum num="06" />
              </div>
              <h2 className="flex items-center gap-3 font-sans text-xl font-black uppercase tracking-tight text-gray-900 lg:text-2xl">
                Better IDE Experience
                <DoubleCross />
              </h2>
              <p className="mb-14 mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
                Built for developers. Loved by IDEs.
              </p>
              <div className="mb-10 flex items-center gap-2">
                <span className="h-px w-8 bg-gray-300" />
                <span className="h-1 w-1 bg-[#0500ff]" />
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <IDECard
                  icon={<PixelBranchIcon />}
                  title="API Explorer"
                  desc="Explore your API endpoints visually."
                />
                <IDECard
                  icon={<PixelEyeIcon />}
                  title="Hover Docs"
                  desc="Instant API docs on hover."
                />
                <IDECard
                  icon={<PixelSettingsIcon />}
                  title="Portal"
                  desc="All-in-one API management."
                />
                <IDECard
                  icon={<PixelQuickInsertIcon />}
                  title="Quick Insert"
                  desc="Insert API calls with one click."
                />
                <IDECard
                  icon={<PixelSearchIcon />}
                  title="Auto Detect"
                  desc="Detect OpenAPI files automatically."
                />
                <IDECard
                  icon={<PixelSparkleIcon />}
                  title="JS IntelliSense"
                  desc="Smart suggestions for API usage."
                />
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ===== Section 07: Ready to generate ===== */}
        <section className="py-20 lg:py-28">
          <div className="flex items-start gap-4">
            <div className="hidden flex-col gap-4 lg:flex">
              <SectionNum num="07" />
            </div>
            <div className="flex-1">
              <div className="mb-2 lg:hidden">
                <SectionNum num="07" />
              </div>
              <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
                <div className="flex flex-1 flex-col gap-6">
                  <h2 className="font-sans text-3xl font-black uppercase tracking-tighter text-gray-900">
                    Ready to generate
                  </h2>
                  <p className="font-mono text-xs uppercase tracking-wider text-gray-500">
                    One spec is all it takes. Let WORMA do the rest.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href="#"
                      className="inline-flex items-center gap-3 border border-[#0500ff] px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90"
                      style={{ backgroundColor: themeBlue }}
                    >
                      GET STARTED
                      <ArrowUpRight className="h-5 w-5" />
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-3 border border-gray-300 bg-white px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-gray-700 transition hover:border-[#0500ff] hover:text-[#0500ff]"
                    >
                      VIEW DOCS
                      <ArrowUpRight className="h-5 w-5" />
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 border border-gray-300 bg-white px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-gray-700 transition hover:border-[#0500ff] hover:text-[#0500ff]"
                    >
                      GITHUB
                    </a>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="relative">
                    <span className="absolute -left-1 -top-1 h-2.5 w-2.5 border-l border-t border-gray-400" />
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 border-r border-t border-gray-400" />
                    <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b border-l border-gray-400" />
                    <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b border-r border-gray-400" />
                    <span className="absolute left-1/2 -top-1 h-1.5 w-px -translate-x-1/2 bg-gray-400" />
                    <span className="absolute left-1/2 -bottom-1 h-1.5 w-px -translate-x-1/2 bg-gray-400" />
                    <div className="absolute -left-1 -top-5">
                      <SceneTag label="DEPLOY_01" />
                    </div>
                    <div className="absolute -bottom-4 -right-4">
                      <Crosshair />
                    </div>
                    <div className="flex h-64 w-64 items-center justify-center border border-gray-300 bg-gray-50 sm:h-80 sm:w-80">
                      <div className="font-mono text-xs tracking-wider text-gray-400">
                        CTA IMAGE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pre-Footer Command Bar */}
      <CommandBar />

      {/* ===== Footer ===== */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1 font-mono text-lg font-black tracking-[0.25em] text-gray-900">
                <span className="text-[#0500ff]">W</span>
                <span className="text-gray-400">O</span>
                <span className="text-[#0500ff]">R</span>
                <span className="text-gray-400">M</span>
                <span className="text-[#0500ff]">A</span>
              </div>
              <p className="font-mono text-xs tracking-wider text-gray-500">
                One OpenAPI.
              </p>
              <p className="font-mono text-xs tracking-wider text-gray-500">
                Infinite Possibilities.
              </p>
              <p className="font-mono text-[10px] tracking-wider text-gray-400">
                © 2025 WORMA. ALL RIGHTS RESERVED.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900">
                  Product
                </span>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  HOMEPAGE
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  FEATURES
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  PRICING
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  CHANGELOG
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900">
                  Resources
                </span>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  DOCS
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  EXAMPLES
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  API REFERENCE
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  BLOG
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900">
                  Community
                </span>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  GITHUB
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  DISCORD
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  TWITTER
                </Link>
                <Link href="#" className="font-mono text-xs tracking-wider text-gray-500 transition hover:text-gray-900">
                  VIDEO
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border border-gray-300 px-4 py-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-700">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900">
                  GitHub Stars
                </span>
                <span className="font-mono text-xs font-black tracking-wider text-gray-900">
                  42.3k
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Terminal status bar */}
      <div className="border-t border-gray-200 bg-black px-6 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between font-mono text-[10px] tracking-wider text-white">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 animate-pulse"
                style={{ backgroundColor: accentLime }}
              />
              CONNECTION SECURE
            </span>
            <span className="hidden sm:inline">{'>'} ACCESS GRANTED_</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">NODE: CYBR_01</span>
            <span
              className="px-1.5 font-bold text-black"
              style={{ backgroundColor: accentLime }}
            >
              SCN: 0007
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
