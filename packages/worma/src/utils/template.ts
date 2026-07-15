import type { HelperOptions } from 'handlebars'
import type HandlebarsType from 'handlebars'
import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import handlebars from 'handlebars'
import { existsPromise } from './base'
import { format } from './format'

// Register partials for template reuse, supports passing an hbs instance
export async function registerPartials(baseTemplatePath: string, hbs: typeof HandlebarsType = handlebars) {
  const partialsDir = path.resolve(baseTemplatePath, 'partials')
  try {
    const partialFiles = await glob('**/*.handlebars', {
      ignore: 'node_modules/**',
      cwd: partialsDir,
    })
    for (const file of partialFiles) {
      const partialName = file.replace('.handlebars', '').replace(/\\/g, '/')
      const partialContent = await fs.readFile(path.join(partialsDir, file), 'utf-8')
      hbs.registerPartial(partialName, partialContent)
    }
  }
  catch {
    // partials dir may not exist — that's fine
  }
}

const getType = (obj: any) => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()

/**
 * Register the common set of Handlebars helpers onto the given instance.
 * Call this on every newly created isolated Handlebars instance.
 */
export function registerCommonHelpers(hbs: typeof HandlebarsType) {
  hbs.registerHelper('isType', function (this: any, value, type: string, options: HelperOptions) {
    if (getType(value) === type) {
      return options.fn(this)
    }
    return options.inverse(this)
  })
  hbs.registerHelper('and', function (this: any, ...rest) {
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
  hbs.registerHelper('or', function (this: any, ...rest) {
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
  hbs.registerHelper('eq', (a, b) => a === b)
  hbs.registerHelper('not', (a, b) => a !== b)
  hbs.registerHelper('join', (...rest) => {
    const args = Array.prototype.slice.call(rest, 0, -1)
    return args.join('')
  })
  hbs.registerHelper('raw', text => new hbs.SafeString(text))
  hbs.registerHelper('stripStarPrefix', (text: string) => {
    if (!text || typeof text !== 'string')
      return text
    return text.split('\n').map(line => line.replace(/^\* ?/, '')).join('\n')
  })
  /**
   * Scan the type string for every PascalCase identifier that is in componentNames
   * (and not already prefixed with `${importName}.`) and prefix it.
   * Works uniformly for top-level names, generics, object literals, and arrays.
   *
   * @param typeStr       The type expression to process.
   * @param componentNames The list of component schema names to prefix.
   * @param importName     The imported namespace name to prefix with. Defaults to "ComponentTypes".
   */
  hbs.registerHelper('addNamespace', (typeStr: unknown, componentNames: unknown, importName?: unknown) => {
    const type = typeStr as string
    const names = componentNames as string[]
    const importPrefix = (typeof importName === 'string' && importName.length > 0) ? importName : 'ComponentTypes'
    if (!type || !Array.isArray(names) || names.length === 0) {
      return new hbs.SafeString(type || 'unknown')
    }
    const nameSet = new Set(names)
    const escapedPrefix = importPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const result = type.replace(new RegExp(`(?<!${escapedPrefix}\\.)(\\b[A-Z]\\w*\\b)`, 'g'), (match) => {
      return nameSet.has(match) ? `${importPrefix}.${match}` : match
    })
    return new hbs.SafeString(result)
  })
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
