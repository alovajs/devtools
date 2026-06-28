import { ArrowRight, Code2, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'AI Skill 一键生成',
    description: 'AI 读懂你的所有 API，自动生成智能补全与调用提示。',
  },
  {
    icon: <Code2 className="h-6 w-6" />,
    title: '四合一信息输出',
    description: '一份文档，四方受益：代码、类型、文档、AI Skill。',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: '多请求库 + 自定义模板',
    description: 'Alova / Axios / Fetch / Ky，自由切换并保持结构一致。',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: '编辑器内文档',
    description: '悬停即阅，JavaScript 也能享受类型提示与接口说明。',
  },
]

const demos = [
  { title: 'TypeScript 示例', url: 'https://stackblitz.com' },
  { title: 'ESM 示例', url: 'https://stackblitz.com' },
  { title: 'CommonJS 示例', url: 'https://stackblitz.com' },
  { title: 'Monorepo 示例', url: 'https://stackblitz.com' },
]

const backendItems = ['Java', 'Go', 'Python', 'Node.js', 'FastAPI', 'Spring Boot']
const frontendItems = ['Alova', 'Axios', 'Fetch', 'Ky', 'React', 'Vue']

export default function HomePage() {
  return (
    <main className="worma-page text-warm-white relative overflow-hidden px-6 pb-24 pt-16 lg:px-16 md:px-10">
      <div className="worma-sparkles pointer-events-none" />
      <section className="worma-section hero border-gold/20 relative mx-auto mb-24 max-w-7xl overflow-hidden border rounded-[32px] bg-[#130e18]/80 p-8 shadow-[0_30px_120px_rgba(0,80,255,0.14)] lg:p-16 sm:p-12">
        <div className="worma-hero-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center gap-8 text-center">
          <span className="text-gold/80 text-sm tracking-[0.32em] uppercase">OpenAPI 时代的虫洞</span>
          <h1 className="max-w-4xl text-4xl text-white font-semibold leading-tight sm:text-6xl">
            一份 OpenAPI，两个世界
          </h1>
          <p className="text-warm-white/90 max-w-3xl text-base leading-8 sm:text-lg">
            worma —— 正如虫洞连接宇宙的两端，我们将后端接口与前端代码，开发者与 AI，无缝桥接。
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://stackblitz.com"
              target="_blank"
              rel="noreferrer"
              className="worma-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm text-white font-semibold transition hover:bg-blue-400/90"
            >
              即刻体验
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/docs/quick-start" className="worma-button-secondary border-gold/40 text-gold hover:border-gold inline-flex items-center justify-center border rounded-full px-6 py-3 text-sm font-semibold transition hover:text-white">
              快速开始
            </Link>
          </div>
          <div className="worma-pill text-warm-white/80 border border-white/10 rounded-full bg-white/5 px-5 py-3 text-sm">
            npx skills add alovajs/skills --skill worma
          </div>
          <div className="worma-badge-grid grid gap-3 lg:grid-cols-4 sm:grid-cols-2">
            {['生成调用代码', 'TypeScript 类型', '接口文档', 'AI Skill'].map(item => (
              <div key={item} className="border-gold/20 text-gold/90 border rounded-3xl bg-[#0b0810]/80 px-4 py-3 text-xs tracking-[0.2em] uppercase shadow-[0_20px_50px_rgba(212,168,67,0.08)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="worma-section border-gold/20 mx-auto mb-24 max-w-7xl border rounded-[32px] bg-[#140f1a]/80 px-6 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.2)] sm:px-10">
        <div className="text-center">
          <h2 className="worma-section-title">AI 写代码，接口总出错？</h2>
          <p className="text-warm-white/80 mx-auto mt-4 max-w-2xl text-base leading-7">
            AI 无法准确理解你的接口定义时，结果往往是函数名猜错、参数对不上、调用凭空捏造。
          </p>
        </div>
        <div className="grid mt-12 gap-6 lg:grid-cols-3">
          {[
            {
              title: '函数名猜错',
              description: 'AI 生成与文档不一致的接口名，运行时报错。',
            },
            {
              title: '参数不匹配',
              description: '请求参数定义不准确，导致反复调试与修正。',
            },
            {
              title: 'AI 不了解你的 API',
              description: '没有规范化 API 说明，AI 会凭空捏造不可用调用。',
            },
          ].map(card => (
            <div key={card.title} className="worma-panel border-gold/15 flex flex-col gap-4 border rounded-[28px] bg-[#100b14]/80 p-6">
              <div className="text-4xl">🎯</div>
              <h3 className="text-xl text-white font-semibold">{card.title}</h3>
              <p className="text-warm-white/80 text-sm leading-6">{card.description}</p>
            </div>
          ))}
        </div>
        <p className="text-warm-white/70 mt-10 text-center text-base">
          而这，正是 worma 诞生于世的理由。
        </p>
      </section>

      <section className="worma-section border-gold/20 mx-auto mb-24 max-w-7xl border rounded-[32px] bg-[#100a14]/85 p-6 sm:p-10">
        <div className="text-center">
          <h2 className="worma-section-title">虫洞的法则</h2>
          <p className="text-warm-white/80 mx-auto mt-3 max-w-2xl text-base leading-7">
            从后端规范文档，到前端自动调用，再到 AI 智能补全，worma 将这三段旅程无缝串联。
          </p>
        </div>
        <div className="grid mt-12 gap-6 lg:grid-cols-3">
          {[
            {
              label: '步骤 1',
              title: '后端交付 OpenAPI 文件',
              detail: 'Swagger / Knife4j / FastAPI 等统一标准文件。',
              code: 'openapi: 3.0.0\npaths:\n  /user:\n    get:\n      summary: 获取用户信息',
            },
            {
              label: '步骤 2',
              title: 'npx worma gen 一键生成',
              detail: '.skills/ + src/api/ 双产出，AI Skill 与调用代码同时写入。',
              code: 'npx worma gen\n// 生成 .skills/SKILL.md\n// 生成 src/api/user.ts',
            },
            {
              label: '步骤 3',
              title: 'AI 自动补全，精准调用',
              detail: '描述意图即得代码，AI 无需再凭空猜测接口。',
              code: 'const user = await api.user.getUser({\n  id: 1001\n})',
            },
          ].map(step => (
            <div key={step.title} className="worma-panel border-gold/15 flex flex-col gap-5 border rounded-[28px] bg-[#120b16]/90 p-6">
              <div className="bg-gold/10 text-gold inline-flex rounded-full px-4 py-2 text-sm font-semibold">{step.label}</div>
              <div>
                <h3 className="text-2xl text-white font-semibold">{step.title}</h3>
                <p className="text-warm-white/75 mt-3 text-sm leading-7">{step.detail}</p>
              </div>
              <pre className="worma-code text-warm-white/80 overflow-x-auto border border-white/10 rounded-3xl bg-[#0b0810]/90 p-4 text-sm">
                {step.code}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="worma-section border-gold/20 mx-auto mb-24 max-w-7xl border rounded-[32px] bg-[#100b16]/90 p-6 sm:p-10">
        <div className="text-center">
          <h2 className="worma-section-title">四把密钥，开启虫洞</h2>
        </div>
        <div className="grid mt-10 gap-6 lg:grid-cols-4">
          {features.map(feature => (
            <div key={feature.title} className="worma-panel border-gold/15 border rounded-[28px] bg-[#110915]/90 p-6 space-y-4">
              <div className="bg-gold/10 text-gold h-14 w-14 inline-flex items-center justify-center rounded-3xl">{feature.icon}</div>
              <h3 className="text-xl text-white font-semibold">{feature.title}</h3>
              <p className="text-warm-white/80 text-sm leading-7">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="worma-section border-gold/20 mx-auto mb-24 max-w-7xl border rounded-[32px] bg-[#100b14]/90 p-6 sm:p-10">
        <div className="text-center">
          <h2 className="worma-section-title">万物皆可连通</h2>
          <p className="text-warm-white/80 mx-auto mt-3 max-w-2xl text-base leading-7">
            无论你站在哪一端，worma 都能打通你与 AI 之间的最后一道壁垒。
          </p>
        </div>
        <div className="grid mt-12 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="border-gold/15 border rounded-[28px] bg-[#120b16]/90 p-6 space-y-3">
            <h3 className="text-lg text-white font-semibold">后端语言</h3>
            <div className="text-warm-white/80 grid gap-2 text-sm">
              {backendItems.map(item => (
                <div key={item} className="worma-chip">{item}</div>
              ))}
            </div>
          </div>
          <div className="worma-matrix-center border-gold/20 border rounded-[32px] bg-[#0f0812]/95 p-8 text-center">
            <div className="mb-3 text-xl text-white font-semibold">worma 虫洞</div>
            <div className="to-gold/20 mx-auto h-32 w-32 rounded-full from-blue-500/30 via-white/20 bg-gradient-to-br shadow-[0_0_60px_rgba(0,80,255,0.25)] blur-[1px]" />
          </div>
          <div className="border-gold/15 border rounded-[28px] bg-[#120b16]/90 p-6 space-y-3">
            <h3 className="text-lg text-white font-semibold">前端请求库</h3>
            <div className="text-warm-white/80 grid gap-2 text-sm">
              {frontendItems.map(item => (
                <div key={item} className="worma-chip">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="worma-section border-gold/20 mx-auto mb-24 max-w-7xl border rounded-[32px] bg-[#110914]/95 p-6 sm:p-10">
        <div className="text-center">
          <h2 className="worma-section-title">穿越虫洞，即刻体验</h2>
        </div>
        <div className="grid mt-10 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {demos.map(demo => (
            <a
              key={demo.title}
              href={demo.url}
              target="_blank"
              rel="noreferrer"
              className="worma-panel group border-gold/15 hover:border-gold/40 border rounded-[28px] bg-[#0f0811]/95 p-6 transition hover:-translate-y-1"
            >
              <div className="bg-gold/10 text-gold mb-5 h-12 w-12 rounded-3xl text-center text-2xl leading-[3rem]">⟁</div>
              <h3 className="text-xl text-white font-semibold">{demo.title}</h3>
              <p className="text-warm-white/75 mt-3 text-sm leading-6">一键打开 StackBlitz 在线预览。</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-blue-300 font-semibold transition group-hover:text-blue-100">
                打开示例
                {' '}
                <ArrowRight className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="worma-section border-gold/20 mx-auto max-w-7xl border rounded-[32px] bg-[#120a15]/95 p-6 text-center sm:p-10">
        <h2 className="worma-section-title">为你的 AI 装上 worma 之眼</h2>
        <pre className="worma-code text-warm-white/80 mx-auto mt-8 max-w-3xl border border-white/10 rounded-3xl bg-[#0c0810]/95 p-5 text-sm">
          npx skills add alovajs/skills --skill worma
        </pre>
        <p className="text-warm-white/80 mx-auto mt-6 max-w-2xl text-base leading-7">
          安装完成，AI 便能理解 worma 的配置与用法。—— 虫洞已开启。
        </p>
        <div className="text-warm-white/70 mt-10 flex flex-wrap justify-center gap-4 text-sm">
          <a href="https://github.com/alova-devtools" target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a>
          <Link href="/docs" className="transition hover:text-white">文档</Link>
          <a href="https://github.com/alova-devtools/alova-devtools/discussions" target="_blank" rel="noreferrer" className="transition hover:text-white">社区</a>
        </div>
      </footer>
    </main>
  )
}
