/**
 * Hover-doc configuration & token injection.
 *
 * `hoverDocsConfig` maps a code identifier (exactly as it appears in the
 * Shiki-highlighted code samples) to the JSDoc markdown body rendered in
 * the hover tooltip. To make a new token hoverable, add an entry here —
 * no file extraction, fully configurable.
 */
export const hoverDocsConfig: Record<string, string> = {
  getPetById: `[GET] Find pet by ID

path: /pet/{petId}

**Path Parameters**
\`\`\`ts
type PathParameters = {
  // ID of pet to return
  petId: number
}
\`\`\`

**Response**
\`\`\`ts
type Response = {
  id?: number
  name: string
  category?: {
    id?: number
    name?: string
  }
  // [items] start
  // [items] end
  photoUrls: string[]
  // [items] start
  // [items] end
  tags?: Array<{
    id?: number
    name?: string
  }>
  // pet status in the store
  status?: "available" | "pending" | "sold"
}
\`\`\`
`,
}

/**
 * Mark Shiki-generated identifier spans so the client can attach hover
 * tooltips. Wraps any `<span ...>TOKEN</span>` whose trimmed text content
 * is one of `tokens` in an inner `<span data-hover-token>` carrying
 * Tailwind utility classes (dotted underline + hover affordance) — no
 * named CSS class is used, so nothing needs to be added to `global.css`.
 *
 * Shiki emits token styling as inline `style="color:#..."` (not `class`),
 * so we match any span via `<span [^>]*>`. Shiki also frequently folds a
 * leading/trailing space into the token span (e.g. `await getPetById` →
 * the function span holds ` getPetById`), so we capture surrounding
 * whitespace separately and keep it outside the marked inner span.
 */
export function injectHoverTokens(html: string, tokens: Iterable<string>): string {
  let out = html
  for (const token of tokens) {
    if (!token)
      continue
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(<span [^>]*>)(\\s*)(${escaped})(\\s*)(</span>)`, 'g')
    out = out.replace(
      re,
      (_whole, open: string, ws1: string, text: string, ws2: string, close: string) =>
        `${open}${ws1}<span data-hover-token="${token}" class="cursor-help border-b border-dotted border-[#58a6ff]/75 transition-colors duration-150 hover:bg-[#58a6ff]/20 hover:border-[#58a6ff]">${text}</span>${ws2}${close}`,
    )
  }
  return out
}
