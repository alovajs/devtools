import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
/**
 * Helpers for generating API client code to a temp directory,
 * bundling it with esbuild, and dynamically importing it for runtime tests.
 */
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import { generate } from '@/index'

export interface BuildOptions {
  /** Template name: 'alova' | 'axios' | 'fetch' | 'ky' */
  template: 'alova' | 'axios' | 'fetch' | 'ky'
  /** Module type */
  type: 'ts' | 'module' | 'commonjs'
  /** Which service tag file to load (e.g. 'pet', 'clients') */
  serviceTag: string
  /** OpenAPI fixture file name (defaults to openapi_300.yaml) */
  openApiFile?: string
  /** Override the baseURL in the generated index file */
  baseURLOverride?: string
}

export interface GeneratedModule {
  /** Call a named export from the service tag file */
  call: (fnName: string, config?: Record<string, any>) => Promise<any>
  /** Remove the temp directory */
  cleanup: () => Promise<void>
}

const OPENAPIS_DIR = resolve(__dirname, '../openapis')
// node_modules locations for dependency resolution
const WORMA_ROOT = resolve(__dirname, '../..')
const PROJECT_ROOT = resolve(__dirname, '../../../..')

// Map type → file extension used by each template
const EXT: Record<string, Record<string, string>> = {
  alova: { ts: 'ts', module: 'js', commonjs: 'cjs' },
  axios: { ts: 'ts', module: 'js', commonjs: 'cjs' },
  fetch: { ts: 'ts', module: 'js', commonjs: 'cjs' },
  ky: { ts: 'ts', module: 'js', commonjs: 'cjs' },
}

/** Patch the baseURL in the generated index file */
async function patchBaseURL(dir: string, ext: string, baseURL: string) {
  const { readFileSync, writeFileSync } = await import('node:fs')
  const indexFile = join(dir, `index.${ext}`)
  if (!existsSync(indexFile))
    return
  let content = readFileSync(indexFile, 'utf-8')
  // Replace quoted URL values (single or double quotes), preserving trailing slash if present
  content = content.replace(
    /(baseURL|prefixUrl|prefix|baseUrl)\s*:\s*(["'])([^"']*)\2/g,
    (_, key: string, quote: string, currentVal: string) => {
      const trailingSlash = currentVal.endsWith('/') ? '/' : ''
      const normalized = baseURL.replace(/\/+$/, '')
      return `${key}: ${quote}${normalized}${trailingSlash}${quote}`
    },
  )
  writeFileSync(indexFile, content)
}

export async function buildGeneratedModule(opts: BuildOptions): Promise<GeneratedModule> {
  const { template, type, serviceTag, openApiFile, baseURLOverride } = opts
  const ext = EXT[template][type]
  const tmpDir = join(tmpdir(), `worma-test-${template}-${type}-${serviceTag}-${Date.now()}`)
  mkdirSync(tmpDir, { recursive: true })

  const templateFn = (await import('@/template'))[template]
  await generate({
    generator: [
      {
        input: resolve(OPENAPIS_DIR, openApiFile ?? 'openapi_300.yaml'),
        output: tmpDir,
        plugins: [templateFn()],
        type: type === 'ts' ? 'ts' : type === 'module' ? 'module' : 'commonjs',
      },
    ],
  })

  if (baseURLOverride) {
    await patchBaseURL(tmpDir, ext, baseURLOverride)
  }

  // Find the service tag file
  const servicesDir = join(tmpDir, 'services')
  const tagFilePath = existsSync(servicesDir)
    ? join(servicesDir, `${serviceTag}.${ext}`)
    : join(tmpDir, `${serviceTag}.${ext}`)

  // Bundle into a single CJS file, bundling all dependencies
  // Use nodePaths to resolve from the monorepo root node_modules
  const bundleOut = join(tmpDir, `_bundle_${serviceTag}.cjs`)
  await build({
    entryPoints: [tagFilePath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: bundleOut,
    nodePaths: [join(WORMA_ROOT, 'node_modules'), join(PROJECT_ROOT, 'node_modules')],
    resolveExtensions: ['.ts', '.js', '.cjs', '.mjs'],
    // Use 'module' condition to resolve ESM-only packages (ky, alova) via their ESM entry
    conditions: ['import', 'require', 'default'],
    mainFields: ['main', 'module'],
    logLevel: 'error',
  })

  // eslint-disable-next-line ts/no-require-imports
  const mod = require(bundleOut)

  return {
    async call(fnName: string, config: Record<string, any> = {}) {
      const fn = mod[fnName]
      if (!fn) {
        throw new Error(`Function "${fnName}" not found. Available: ${Object.keys(mod).join(', ')}`)
      }
      return fn(config)
    },
    async cleanup() {
      try {
        rmSync(tmpDir, { recursive: true, force: true })
      }
      catch {
        /* ignore */
      }
    },
  }
}
