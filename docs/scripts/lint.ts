import type { FileObject } from 'next-validate-link'
import { register } from 'fumadocs-mdx/node'
import { printErrors, scanURLs, validateFiles } from 'next-validate-link'

// 2. Register fumadocs-mdx .mdx loader SECOND (innermost)
register()

// Dynamic import: hooks must be active when source loads .mdx files
const { source } = await import('@/lib/source')

type Page = (typeof source)['$inferPage']

function getHeadings({ data }: Page): string[] {
  return data.toc.map(item => item.url.slice(1))
}

async function getFiles(): Promise<FileObject[]> {
  return Promise.all(
    source.getPages().map(
      async (page): Promise<FileObject> => ({
        path: page.absolutePath || page.path,
        content: await page.data.getText('raw'),
        url: page.url,
        data: page.data,
      }),
    ),
  )
}

async function checkLinks() {
  const scanned = await scanURLs({
    preset: 'next',
    populate: {
      'docs/[[...slug]]': source.getPages().map(page => ({
        value: {
          slug: page.slugs,
        },
        hashes: getHeadings(page),
      })),
    },
  })

  const errors = await validateFiles(await getFiles(), {
    scanned,
    markdown: {
      components: {
        Card: { attributes: ['href'] },
      },
    },
    checkRelativePaths: 'as-url',
  })

  printErrors(errors, true)

  if (errors.length > 0)
    process.exit(1)
}

void checkLinks()
