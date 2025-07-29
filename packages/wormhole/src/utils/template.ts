import type { HelperOptions } from 'handlebars'
import fs from 'node:fs/promises'
import path from 'node:path'
import handlebars from 'handlebars'
import { getGlobalConfig } from '@/config'
import { existsPromise } from './base'
import { format } from './format'

const DEFAULT_CONFIG = getGlobalConfig()

const getType = (obj: any) => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()

handlebars.registerHelper('isType', function (this: any, value, type: string, options: HelperOptions) {
  if (getType(value) === type) {
    return options.fn(this)
  }
  return options.inverse(this)
})
handlebars.registerHelper('and', function (this: any, ...rest) {
  const args = Array.prototype.slice.call(rest, 0, -1)
  const options = rest[rest.length - 1] as HelperOptions
  const result = args.every((arg) => {
    if (Array.isArray(arg)) {
      return arg.length === 0
    }
    return Boolean(arg)
  })
  return result ? options.fn(this) : options.inverse(this)
})
handlebars.registerHelper('or', function (this: any, ...rest) {
  const args = Array.prototype.slice.call(rest, 0, -1)
  const options = rest[rest.length - 1] as HelperOptions
  const result = args.some((arg) => {
    if (Array.isArray(arg)) {
      return arg.length !== 0
    }
    return Boolean(arg)
  })
  return result ? options.fn(this) : options.inverse(this)
})
handlebars.registerHelper('eq', (a, b) => a === b)
handlebars.registerHelper('not', (a, b) => a !== b)
// Register custom helper function 'raw'

handlebars.registerHelper(
  'raw',
  text =>
  // Returns the original string without HTML escaping

    new handlebars.SafeString(text),
)
/**
 * Read and render the handlebars file
 * @param templatePath Template file path
 * @param view -Data objects required to render the template
 * @returns Rendered content
 */
export async function readAndRenderTemplate(templatePath: string, view: any) {
  let data = ''
  try {
    data = await fs.readFile(path.resolve(DEFAULT_CONFIG.templatePath, `${templatePath}.handlebars`), 'utf-8')
  }
  catch {
    data = (await import(`../templates/${templatePath}.handlebars`)).default
  }
  return handlebars.compile(data)(view)
}

/**
 * Pass in text content and generate a custom file in the specified directory
 * @param distDir The directory where the file to be generated is located
 * @param fileName File name to be generated
 * @param content File content
 */
export async function generateFile(distDir: string, fileName: string, content: string) {
  if (!(await existsPromise(distDir))) {
    await fs.mkdir(distDir, { recursive: true })
  }
  const filePath = path.join(distDir, fileName)
  const formattedText = await format(content)
  await fs.writeFile(filePath, formattedText)
}
