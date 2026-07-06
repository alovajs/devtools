'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* ─── Method badge colors (VS Code style) ─── */
const methodColors: Record<string, string> = {
  GET: 'bg-[#2ea043] text-white',
  POST: 'bg-[#1f6feb] text-white',
  PUT: 'bg-[#d29922] text-[#0d1117]',
  DELETE: 'bg-[#f85149] text-white',
  PATCH: 'bg-[#a371f7] text-white',
}

/* ─── Minimal inline markdown: **bold** and `code` ─── */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\*\*[^*]+\*\*|`[^`]+`/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  m = re.exec(text)
  while (m) {
    if (m.index > last)
      nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="text-[#e6edf3] font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      )
    }
    else {
      nodes.push(
        <code key={key++} className="rounded-md bg-[#30363d] px-1.5 py-0.5 text-[13px] text-[#d2a8ff] font-mono">
          {tok.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + tok.length
    m = re.exec(text)
  }
  if (last < text.length)
    nodes.push(text.slice(last))
  return nodes
}

/* ─── Render a JSDoc body into a tooltip.
   Supports: fenced ```code``` blocks, `[METHOD]` badges,
   `**bold**`, `inline code`, `path: ...` meta lines and plain paragraphs. ─── */
function renderJsDoc(rawDoc: string): ReactNode {
  const doc = rawDoc.trim()
  const lines = doc.split('\n')

  const blocks: ReactNode[] = []
  let para: string[] = []
  let key = 0

  const flushPara = () => {
    if (para.length === 0)
      return
    const text = para.join(' ').trim()
    para = []
    if (!text)
      return

    // [METHOD] Title line
    const methodMatch = text.match(/^\[(GET|POST|PUT|DELETE|PATCH)\]/u)
    if (methodMatch) {
      const title = text.slice(methodMatch[0].length).trimStart()
      blocks.push(
        <p key={key++} className="flex items-center gap-2 text-[15px]">
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${methodColors[methodMatch[1]]}`}>
            {methodMatch[1]}
          </span>
          <span className="text-[#e6edf3]">{renderInline(title)}</span>
        </p>,
      )
      return
    }

    // path: /pet/{petId}
    if (text.toLowerCase().startsWith('path:')) {
      const pathValue = text.slice(5).trimStart()
      blocks.push(
        <p key={key++} className="text-[13px] text-[#8b949e]">
          path:
          <span className="ml-1 text-[#c9d1d9] font-mono">{pathValue}</span>
        </p>,
      )
      return
    }

    // Section headers: bold white text, slightly larger
    if (/^\*\*(?:Path Parameters|Response|Parameters|Returns|Example)\*\*$/.test(text)) {
      const title = text.replace(/^\*\*|\*\*$/g, '')
      blocks.push(
        <p key={key++} className="mb-1 mt-3 text-[13px] text-[#e6edf3] font-semibold">
          {title}
        </p>,
      )
      return
    }

    // Normal paragraph
    blocks.push(<p key={key++} className="text-[13px] text-[#c9d1d9]">{renderInline(text)}</p>)
  }

  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (trimmed === '') {
      flushPara()
    }
    else if (trimmed.startsWith('```')) {
      flushPara()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push(
        <pre
          key={key++}
          className="my-1 overflow-x-auto border border-[#30363d] rounded-lg bg-[#161b22] p-3 text-[13px] text-[#c9d1d9] leading-[1.35] font-mono"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      )
    }
    else {
      para.push(trimmed)
    }
    i++
  }
  flushPara()

  return <div className="space-y-1">{blocks}</div>
}

interface CodeBlockProps {
  html: string
  hoverDocs?: Record<string, string>
  className?: string
}

interface TooltipState {
  token: string
  left: number
  top: number
}

/**
 * Hover-show delay (ms). Tooltip only appears if the cursor rests on a
 * token for this long, preventing flicker on quick sweeps.
 */
const SHOW_DELAY = 300
/**
 * Hover-hide grace (ms). Brief so leaving a token hides promptly, but
 * non-zero to survive the mouseout/mouseover churn between adjacent
 * child spans inside the code block.
 */
const HIDE_DELAY = 150

/**
 * Renders Shiki-generated HTML. Any identifier span marked with
 * `data-hover-token` (by `injectHoverTokens`) becomes hoverable: resting
 * the cursor on it for SHOW_DELAY shows a portal-rendered tooltip with
 * the JSDoc from `hoverDocs[token]`, anchored at the token's bottom-right
 * corner (clamped to the viewport so it never overflows the right edge).
 */
export function CodeBlock({ html, hoverDocs, className }: CodeBlockProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeTokenEl = useRef<HTMLElement | null>(null)

  const clearShow = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
  }, [])

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const hideTooltip = useCallback(() => {
    clearShow()
    clearHide()
    activeTokenEl.current = null
    setTooltip(null)
  }, [clearShow, clearHide])

  const handleMouseOver = useCallback(
    (e: React.MouseEvent) => {
      if (!hoverDocs)
        return
      const el = (e.target as HTMLElement).closest('[data-hover-token]') as HTMLElement | null
      if (!el) {
        // Cursor is over non-token code: cancel any pending show, but
        // leave hide scheduling to mouseout.
        clearShow()
        return
      }
      const token = el.getAttribute('data-hover-token')!
      if (!hoverDocs[token])
        return
      // Entering / still over a token: we want to show (or keep showing).
      clearHide()
      // Already showing this exact token — nothing to do.
      if (activeTokenEl.current === el && tooltip)
        return
      // (Re)start the show timer; cancels any previous pending show so
      // moving between tokens never stacks timers.
      clearShow()
      activeTokenEl.current = el
      showTimer.current = setTimeout(() => {
        const rect = el.getBoundingClientRect()
        // Anchor the tooltip's top-left at the token's bottom-right corner,
        // clamped so it never overflows the viewport's right edge.
        const left = Math.min(rect.right, window.innerWidth - 448)
        setTooltip({ token, left: Math.max(8, left), top: rect.bottom })
      }, SHOW_DELAY)
    },
    [hoverDocs, clearShow, clearHide, tooltip],
  )

  const handleMouseOut = useCallback(
    (e: React.MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-hover-token]')
      if (!el)
        return
      const related = e.relatedTarget as HTMLElement | null
      // Moving onto another token or the tooltip itself: keep open.
      if (related?.closest?.('[data-hover-token]') || related?.closest?.('[data-worma-tooltip]'))
        return
      // Leaving the token: cancel any pending show and schedule a hide.
      clearShow()
      activeTokenEl.current = null
      clearHide()
      hideTimer.current = setTimeout(() => setTooltip(null), HIDE_DELAY)
    },
    [clearShow, clearHide],
  )

  useEffect(() => () => {
    clearShow()
    clearHide()
  }, [clearShow, clearHide])

  return (
    <div className={`relative ${className ?? ''}`} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {tooltip
        && hoverDocs?.[tooltip.token]
        && createPortal(
          <div
            data-worma-tooltip
            onMouseEnter={clearHide}
            onMouseLeave={hideTooltip}
            style={{
              position: 'fixed',
              left: tooltip.left,
              top: tooltip.top,
              transform: 'translate(0, 8px)',
              zIndex: 9999,
            }}
            className="pointer-events-auto max-h-95 max-w-120 w-max overflow-auto border border-[#3d444d] rounded-lg bg-[#252526] p-4 text-[13px] shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
          >
            {renderJsDoc(hoverDocs[tooltip.token])}
          </div>,
          document.body,
        )}
    </div>
  )
}
