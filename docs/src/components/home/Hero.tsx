'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AGENT_PROMPT, COPY_TOAST_MESSAGE } from './agentPrompt'
import Button from './Button'
import CornerPlus from './CornerPlus'

function DotShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const cleanupRef = useRef<(() => void) | null>(null)

  const initShader = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas)
      return
    const el = canvas
    const dpr = window.devicePixelRatio || 1

    function syncSize() {
      const w = el.clientWidth || 1280
      const h = el.clientHeight || 720
      const dw = Math.floor(w * dpr)
      const dh = Math.floor(h * dpr)
      if (el.width !== dw || el.height !== dh) {
        el.width = dw
        el.height = dh
      }
    }

    const ro = new ResizeObserver(syncSize)
    ro.observe(el)
    syncSize()

    const gl = (el.getContext('webgl') || el.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl)
      return
    const ctx = gl

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_dotScale;
varying vec2 v_texCoord;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;

    // Aspect ratio correction so dots are perfectly circular
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) + 0.5;
    vec2 mp = (mouse - 0.5) * vec2(aspect, 1.0) + 0.5;

    // Grid system: 30 cells across the shorter axis
    float gridDensity = 30.0;
    vec2 gridUv = p * gridDensity;
    vec2 id = floor(gridUv);
    vec2 gv = fract(gridUv) - 0.5;

    float n = hash(id);

    // Mouse interaction — radial distance in aspect-corrected space
    float mouseDist = distance(p, mp);
    float active = smoothstep(0.35, 0.0, mouseDist);

    // Dot radius: scaled by u_dotScale (0.5 on mobile, 1.0 on desktop)
    float pxToGv = gridDensity / u_resolution.x;
    float radius = pxToGv * u_dotScale * (5.0 + active * 12.0);

    float d = length(gv);
    float mask = smoothstep(radius, radius * 0.5, d);

    vec3 bgColor = vec3(0.04, 0.04, 0.05);
    vec3 accentColor = vec3(1.0, 0.44, 0.12);

    vec3 col = mix(bgColor, accentColor, mask * (0.35 + active * 0.65));

    gl_FragColor = vec4(col, 1.0);
}`

    function cs(type: number, src: string) {
      const s = ctx.createShader(type)!
      ctx.shaderSource(s, src)
      ctx.compileShader(s)
      return s
    }

    const prog = ctx.createProgram()!
    ctx.attachShader(prog, cs(ctx.VERTEX_SHADER, vs))
    ctx.attachShader(prog, cs(ctx.FRAGMENT_SHADER, fs))
    ctx.linkProgram(prog)
    ctx.useProgram(prog)

    const buf = ctx.createBuffer()
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf)
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW)

    const pos = ctx.getAttribLocation(prog, 'a_position')
    ctx.enableVertexAttribArray(pos)
    ctx.vertexAttribPointer(pos, 2, ctx.FLOAT, false, 0, 0)

    const uTime = ctx.getUniformLocation(prog, 'u_time')
    const uRes = ctx.getUniformLocation(prog, 'u_resolution')
    const uMouse = ctx.getUniformLocation(prog, 'u_mouse')
    const uDotScale = ctx.getUniformLocation(prog, 'u_dotScale')

    mouseRef.current = { x: el.width / (2 * dpr), y: el.height / (2 * dpr) }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouseRef.current = { x: nx * el.width, y: ny * el.height }
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    function render(t: number) {
      syncSize()
      ctx.viewport(0, 0, el.width, el.height)
      if (uTime)
        ctx.uniform1f(uTime, t * 0.001)
      if (uRes)
        ctx.uniform2f(uRes, el.width, el.height)
      if (uMouse)
        ctx.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y)
      if (uDotScale)
        ctx.uniform1f(uDotScale, el.clientWidth < 768 ? 0.5 : 1.0)
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
      animRef.current = requestAnimationFrame(render)
    }
    animRef.current = requestAnimationFrame(render)

    cleanupRef.current = () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    initShader()
    return () => {
      cleanupRef.current?.()
    }
  }, [initShader])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ display: 'block' }}
    />
  )
}

export default function Hero() {
  const [toast, setToast] = useState(false)
  const [version, setVersion] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('https://registry.npmjs.org/wormajs/latest')
      .then(res => res.json())
      .then((data: { version?: string }) => {
        if (!cancelled && data.version)
          setVersion(data.version)
      })
      .catch(() => {
        // keep empty on failure; fallback text below
      })
    return () => {
      cancelled = true
    }
  }, [])

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
    <section className="tech-border-b relative grid grid-cols-1 overflow-hidden lg:grid-cols-2">
      <DotShader />
      <div className="lg:tech-border-r relative z-10 flex flex-col justify-center p-8 lg:p-16">
        <CornerPlus />
        <div className="text-primary font-data-mono mb-8 inline-flex items-center gap-3 text-[10px] tracking-[0.2em]">
          <span className="bg-primary h-2 w-2" />
          {version ? `SYSTEM_INIT // v${version}` : 'SYSTEM_INIT // LOADING'}
        </div>
        <h1 className="font-headline-lg text-on-background mb-8 text-5xl font-bold leading-[0.95] tracking-tighter uppercase lg:text-7xl">
          一份 OpenAPI
          <br />
          从人类到
          <span className="text-primary italic">AI</span>
        </h1>
        <p className="font-body-md text-on-surface-variant mb-12 max-w-md text-sm leading-relaxed">
          为你生成类型安全的接口代码，为AI生成易理解的接口知识。统一规范，加速协同。
        </p>
        <div className="flex gap-4 lg:flex-row lg:items-center">
          <div className="relative">
            <Button variant="primary" onClick={handleCopy}>
              agent安装
            </Button>
            {toast && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-3 py-1.5 text-xs text-white shadow-lg transition-opacity">
                {COPY_TOAST_MESSAGE}
              </div>
            )}
          </div>
          <Button variant="outline" href="/docs">快速开始</Button>
        </div>
        <div className="mt-4">
          <a
            href="https://stackblitz.com/fork/github/alovajs/devtools/tree/main/examples/typescript"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-body-md text-on-background underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            即刻体验
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
          </a>
        </div>
        <div className="font-data-mono text-primary absolute bottom-4 left-8 text-[10px]">LATENCY: 14MS // SECTOR: 0x4F</div>
      </div>
      <div className="relative z-10 flex items-center justify-center p-8 lg:p-16">
        <span className="text-[120px] text-[#020202] font-bold tracking-tighter uppercase">WORMA</span>
        <div className="text-primary font-data-mono absolute bottom-4 left-8 text-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 tracking-wider">
          <span>// COMPAT</span>
          <span>[ TS ]</span>
          <span>[ JS ]</span>
          <span>// RUNTIME</span>
          <span>[ Node.js ]</span>
          <span>[ Deno ]</span>
          <span>[ Bun ]</span>
          <span>// TYPE_SAFE</span>
        </div>
      </div>
    </section>
  )
}
