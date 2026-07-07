'use client'

import { useState } from 'react'
import { AGENT_PROMPT, COPY_TOAST_MESSAGE } from './agentPrompt'
import Button from './Button'
import CornerPlus from './CornerPlus'

export default function Cta() {
  const [toast, setToast] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT)
      setToast(true)
      setTimeout(() => setToast(false), 2500)
    }
    catch {
      // ignore clipboard errors
    }
  }

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
          <div className="relative w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleCopy}
            >
              agent安装
            </Button>
            {toast && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-3 py-1.5 text-xs text-white shadow-lg transition-opacity">
                {COPY_TOAST_MESSAGE}
              </div>
            )}
          </div>
          <Button variant="outline" size="lg" className="px-10 w-full sm:w-auto" href="/docs/quick-start">免费开始</Button>
          <Button variant="outline" size="lg" icon="code" className="px-10 w-full sm:w-auto" href="https://github.com/alovajs/devtools">GitHub</Button>
        </div>
        <p className="font-data-mono text-xs text-on-surface-variant tracking-widest uppercase">
          将上方 Prompts 发送给你的 Coding Agent，快速完成 worma 安装与配置
        </p>
        <div className="mt-16 flex justify-center">
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </div>
    </section>
  )
}
