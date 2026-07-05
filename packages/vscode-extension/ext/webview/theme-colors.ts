import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'

interface TokenColor {
  scope?: string | string[]
  settings: {
    foreground?: string
    background?: string
    fontStyle?: string
  }
}

interface ColorTheme {
  name?: string
  type?: 'light' | 'dark' | 'hcLight' | 'hcDark'
  colors?: Record<string, string>
  tokenColors?: TokenColor[]
  include?: string
}

interface ColorThemeContribution {
  id?: string
  label?: string
  name?: string
  path?: string
  uiTheme?: string
}

const tokenScopes: Record<string, string[]> = {
  keyword: ['keyword'],
  string: ['string'],
  number: ['constant.numeric'],
  comment: ['comment'],
  type: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
  function: ['entity.name.function', 'support.function'],
  property: ['variable.other.property', 'support.variable.property', 'variable.other.object.property'],
  variable: ['variable'],
  operator: ['keyword.operator'],
  punctuation: ['punctuation'],
}

// Dark+ palette — used when the active theme can't be parsed AND the
// webview is in a dark theme kind.
const fallbackColors: Record<string, string> = {
  keyword: '#c586c0',
  string: '#ce9178',
  number: '#b5cea8',
  comment: '#6a9955',
  type: '#4ec9b0',
  function: '#dcdcaa',
  property: '#9cdcfe',
  variable: '#9cdcfe',
  operator: '#d4d4d4',
  punctuation: '#d4d4d4',
}

// Light+ palette — used when the active theme can't be parsed AND the
// webview is in a light theme kind (driven by `data-vscode-theme-kind`).
const lightFallbackColors: Record<string, string> = {
  keyword: '#0000ff',
  string: '#a31515',
  number: '#098658',
  comment: '#008000',
  type: '#267f99',
  function: '#795e26',
  property: '#001080',
  variable: '#001080',
  operator: '#000000',
  punctuation: '#000000',
}

function varsBlock(selector: string, colors: Record<string, string>): string {
  return `${selector} {
${Object.entries(colors)
  .map(([token, color]) => `  --api-code-${token}: ${color};`)
  .join('\n')}
}`
}

export function getSyntaxHighlightCss(): string {
  const theme = getActiveColorTheme()
  const colors = extractTokenColors(theme)

  // Active theme parsed successfully — emit its exact token colors.
  if (theme) {
    return varsBlock(':root', colors).trim()
  }

  // Theme could not be located/parsed. Fall back to a kind-aware palette
  // driven by the webview's reliable `data-vscode-theme-kind` attribute on
  // <body>, so syntax colors at least switch between light and dark instead
  // of being pinned to the Dark+ palette.
  return [
    varsBlock(':root', fallbackColors),
    varsBlock(
      'body[data-vscode-theme-kind="vscode-light"],\nbody[data-vscode-theme-kind="vscode-high-contrast-light"]',
      lightFallbackColors,
    ),
  ].join('\n\n').trim()
}

// NLS placeholder → resolved string map, cached per extension path.
// Built-in themes (theme-defaults) use labels like `%darkModernThemeLabel%`
// which must be resolved against the extension's package.nls.json before
// they can be compared to the value stored in `workbench.colorTheme`.
const nlsCache = new Map<string, Record<string, string>>()

function loadNls(extensionPath: string): Record<string, string> {
  const cached = nlsCache.get(extensionPath)
  if (cached)
    return cached
  const result: Record<string, string> = {}
  const tryRead = (file: string) => {
    try {
      Object.assign(result, parseThemeJson(fs.readFileSync(file, 'utf8')) as Record<string, string>)
    }
    catch {
      /* ignore */
    }
  }
  // Default (English) bundle first, locale-specific overrides win.
  tryRead(path.join(extensionPath, 'package.nls.json'))
  const locale = vscode.env.language?.toLowerCase()
  if (locale) {
    tryRead(path.join(extensionPath, `package.nls.${locale}.json`))
  }
  nlsCache.set(extensionPath, result)
  return result
}

function resolveNls(extensionPath: string, value: string | undefined): string | undefined {
  if (!value)
    return value
  const match = /^%([\w.-]+)%$/.exec(value)
  if (!match)
    return value
  return loadNls(extensionPath)[match[1]] ?? value
}

// Build the set of strings that could identify a contributed theme:
// id / label / name (with NLS resolved), plus the `Default ` prefixed
// variants VS Code's workbench uses for built-in theme display names
// (e.g. `workbench.colorTheme` stores "Default Dark Modern" while the
// contribution's id/label is "Dark Modern").
function themeCandidates(extensionPath: string, theme: ColorThemeContribution): Set<string> {
  const raw = [theme.id, theme.label, theme.name]
  const resolved = raw.map(v => resolveNls(extensionPath, v))
  const candidates = new Set<string>()
  for (const v of [...raw, ...resolved]) {
    if (!v)
      continue
    const trimmed = v.trim()
    if (!trimmed)
      continue
    candidates.add(trimmed)
    candidates.add(`Default ${trimmed}`)
  }
  return candidates
}

function getActiveColorTheme(): ColorTheme | undefined {
  const themeId = (vscode.workspace.getConfiguration().get('workbench.colorTheme') as string | undefined)?.trim()
  if (!themeId) {
    console.warn('[api-code-theme] workbench.colorTheme is not set.')
    return undefined
  }

  let contributing = 0
  for (const ext of vscode.extensions.all) {
    const themes = ext.packageJSON?.contributes?.themes as ColorThemeContribution[] | undefined
    if (!Array.isArray(themes))
      continue
    contributing++

    for (const theme of themes) {
      if (!themeCandidates(ext.extensionPath, theme).has(themeId))
        continue
      if (!theme.path) {
        console.warn(`[api-code-theme] Matched theme "${themeId}" has no path in ${ext.id}.`)
        return undefined
      }
      const themePath = path.join(ext.extensionPath, theme.path)
      try {
        const loaded = loadTheme(themePath, new Set())
        if (!loaded) {
          console.warn(`[api-code-theme] loadTheme returned undefined for ${themePath}`)
        }
        return loaded
      }
      catch (err) {
        console.warn(`[api-code-theme] Failed to load theme ${themePath}:`, err)
        return undefined
      }
    }
  }

  console.warn(
    `[api-code-theme] Theme "${themeId}" not found among ${contributing} theme-contributing extensions. `
    + 'Falling back to kind-aware palette.',
  )
  return undefined
}

function parseThemeJson(content: string): ColorTheme {
  const cleaned = content.replace(/^\uFEFF/, '')
  try {
    return JSON.parse(cleaned) as ColorTheme
  }
  catch {
    return JSON.parse(stripJsonComments(cleaned)) as ColorTheme
  }
}

function stripJsonComments(text: string): string {
  let result = ''
  let inString = false
  let escape = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      result += char
      if (escape) {
        escape = false
      }
      else if (char === '\\') {
        escape = true
      }
      else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      result += char
      continue
    }
    if (char === '/') {
      const next = text[i + 1]
      if (next === '/') {
        while (i < text.length && text[i] !== '\n') i++
        continue
      }
      if (next === '*') {
        i += 2
        while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '/')) i++
        i++
        continue
      }
    }
    result += char
  }
  return result
}

function loadTheme(themePath: string, loaded: Set<string>): ColorTheme | undefined {
  const resolvedPath = path.resolve(themePath)
  if (loaded.has(resolvedPath))
    return undefined
  loaded.add(resolvedPath)

  const content = fs.readFileSync(resolvedPath, 'utf8')
  const parsed = parseThemeJson(content)

  if (parsed.include) {
    const includePath = path.resolve(path.dirname(resolvedPath), parsed.include)
    try {
      const includedTheme = loadTheme(includePath, loaded)
      if (includedTheme) {
        parsed.tokenColors = [
          ...(includedTheme.tokenColors || []),
          ...(parsed.tokenColors || []),
        ]
        parsed.colors = { ...includedTheme.colors, ...parsed.colors }
      }
    }
    catch {
      // ignore include load errors
    }
  }

  return parsed
}

function extractTokenColors(theme: ColorTheme | undefined): Record<string, string> {
  const colors: Record<string, string> = {}

  for (const [token, scopes] of Object.entries(tokenScopes)) {
    let color: string | undefined
    for (const scope of scopes) {
      color = findColorForScope(theme, scope)
      if (color)
        break
    }
    colors[token] = normalizeColor(color) || fallbackColors[token]
  }

  return colors
}

function findColorForScope(theme: ColorTheme | undefined, scope: string): string | undefined {
  if (!theme?.tokenColors)
    return undefined
  const scopeParts = scope.split('.')

  let bestColor: string | undefined
  let bestDepth = -1

  for (const rule of theme.tokenColors) {
    if (!rule.scope || !rule.settings.foreground)
      continue
    const ruleScopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope]
    for (const ruleScope of ruleScopes) {
      const ruleParts = ruleScope.split('.')
      if (scopeParts.length >= ruleParts.length && ruleParts.every((part, i) => scopeParts[i] === part)) {
        if (ruleParts.length > bestDepth) {
          bestDepth = ruleParts.length
          bestColor = rule.settings.foreground
        }
      }
    }
  }
  return bestColor
}

function normalizeColor(color: string | undefined): string | undefined {
  if (!color)
    return undefined
  const trimmed = color.trim()
  if (!trimmed)
    return undefined
  // VSCode theme colors can be 3-digit, 4-digit or 8-digit hex; normalize to 6-digit
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
  }
  if (/^#[0-9a-f]{4}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
  }
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) {
    return trimmed.slice(0, 7)
  }
  return trimmed
}
