'use client'
import { useTheme } from 'next-themes'
import { use, useEffect, useId, useState } from 'react'

export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted)
    return null
  return <MermaidContent chart={chart} />
}

const cache = new Map<string, Promise<unknown>>()

function cachePromise<T>(key: string, promise: () => Promise<T>) {
  if (cache.has(key))
    return cache.get(key)! as Promise<T>
  const p = promise()
  cache.set(key, p)
  return p
}

function MermaidContent({ chart }: { chart: string }) {
  const id = useId()
  const { resolvedTheme } = useTheme()
  const { default: mermaid } = use(cachePromise('mermaid', () => import('mermaid')))

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeCSS: 'margin: 1.5rem auto 0;',
    theme: resolvedTheme === 'dark' ? 'dark' : 'default',
  })

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () =>
      mermaid.render(id, chart.replaceAll('\\n', '\n'))),
  )

  return (
    <div
      ref={(container) => { container && bindFunctions?.(container) }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
