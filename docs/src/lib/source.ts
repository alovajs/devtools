import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { slugsFromData, slugsPlugin } from 'fumadocs-core/source/plugins/slugs'
import { docsContentRoute, docsImageRoute, docsRoute } from './shared'

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  // Allow page frontmatter to override the default slugs (path-derived),
  // e.g. to strip the "01-" / "02-" numeric prefix from file names.
  plugins: [slugsPlugin(slugsFromData())],
})

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png']

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  }
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md']

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  }
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title} (${page.url})

${processed}`
}
