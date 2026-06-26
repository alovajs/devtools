import type HandlebarsType from 'handlebars'
import type { MaybePromise } from '@/helper/config/type'
import type { CacheData, TemplateData, TemplateType } from '@/type'
import type { GeneratorConfig } from '@/type/lib'
import fs from 'node:fs/promises'
import path from 'node:path'
import handlebars from 'handlebars'
import {
  FileExtension,
  MODULE_TYPE_TO_KIND,
  ModuleKind,
  ModuleTypeDir,
  TemplatePlaceholder,
  TemplateSkipDir,
  TemplateTypeEnum,
} from '@/constant'
import { computePerTagHashes, readCacheApis, writeCacheEntry } from '@/functions/wormaJson'
import { logger } from '@/helper/logger'
import { existsPromise, format, registerCommonHelpers, registerPartials } from '@/utils'

/** M1-A2: Handlebars 实例缓存 —— 同 templatePath 复用编译好的 partials 和 helpers */
const hbsInstanceCache = new Map<string, typeof HandlebarsType>()

/** M1-A2: Handlebars 模板编译缓存 —— 同文件路径复用编译结果 */
type HbsTemplateFn = (context?: any, options?: any) => string
const templateCompileCache = new Map<string, HbsTemplateFn>()

function cacheKey(projectPath: string, output: string) {
  return `${projectPath}::${output}`
}

/** 模块类型目录名（与 config.type 不同：commonjs -> common） */
export const MODULE_TYPES = [ModuleTypeDir.TYPESCRIPT, ModuleTypeDir.MODULE, ModuleTypeDir.COMMON] as const
export type ModuleTypeKey = (typeof MODULE_TYPES)[number]

export interface UnlickOptions { output: string }
export interface UnlickFile { fileName: string, ext?: string, output?: string }

interface TemplateConfig {
  type: TemplateType
  templatePath: string
  onHandlebarsCreated?: Array<(hbs: typeof HandlebarsType) => MaybePromise<void>>
}

interface TemplateFileInfo {
  absolutePath: string
  relativePath: string
  fileName: string
  isNoOverwrite: boolean
  templateType?: 'tag' | 'api'
  insideTagDir?: boolean
}

// ---- helpers ----

const TEMPLATE_EXTENSIONS = [
  FileExtension.HBS,
  FileExtension.HANDLEBARS,
  FileExtension.TS,
  FileExtension.TSX,
  FileExtension.JS,
  FileExtension.JSX,
  FileExtension.MJS,
  FileExtension.CJS,
  FileExtension.D_TS,
  FileExtension.D_CTS,
  FileExtension.D_MTS,
]

function isTemplateFile(name: string) {
  return TEMPLATE_EXTENSIONS.some(ext => name.endsWith(ext))
}

function parseEntryName(raw: string) {
  const noOverwrite = raw.startsWith('#')
  return { isNoOverwrite: noOverwrite, name: noOverwrite ? raw.slice(1) : raw }
}

function detectTemplateType(fileName: string, allowTag = true): TemplateFileInfo['templateType'] {
  if (allowTag && fileName.includes(TemplatePlaceholder.TAG))
    return 'tag'
  if (fileName.includes(TemplatePlaceholder.API))
    return 'api'
  return undefined
}

function normalizeSlashes(p: string) {
  return p.replace(/\\/g, '/')
}

function stripExt(fileName: string) {
  if (fileName.endsWith(FileExtension.HANDLEBARS))
    return fileName.slice(0, -FileExtension.HANDLEBARS.length)
  if (fileName.endsWith(FileExtension.HBS))
    return fileName.slice(0, -FileExtension.HBS.length)
  return fileName
}

function joinPath(...parts: string[]) {
  const p = path.join(...parts)
  return p ? normalizeSlashes(p) : p
}

export class TemplateHelper {
  private static instance: TemplateHelper
  /** Runtime cache of parsed template data, keyed by `${projectPath}::${output}`. Flushed to disk via flushAllData. */
  private static _cacheData = new Map<string, CacheData>()
  private config: TemplateConfig

  // ============ hasTagTemplates / instance ============

  public static async hasTagTemplates(templatePath: string, type: TemplateType): Promise<boolean> {
    try {
      const helper = TemplateHelper.load({ type, templatePath })
      const files = await helper.resolveTemplateFiles(templatePath)
      return files.some(f => f.templateType != null)
    }
    catch { return false }
  }

  public static getInstance() {
    if (!TemplateHelper.instance)
      TemplateHelper.instance = new TemplateHelper()
    return TemplateHelper.instance
  }

  private constructor(config?: TemplateConfig) {
    if (config)
      this.config = config
  }

  public load(config: TemplateConfig) {
    this.config = config
    return this
  }

  static load(config: TemplateConfig) { return new TemplateHelper(config) }

  getExt() { return TemplateHelper.getExt(this.config.type) }
  getModuleType() { return TemplateHelper.getModuleType(this.config.type) }

  static getExt(type: TemplateType) { return type === TemplateTypeEnum.TYPESCRIPT ? FileExtension.TS : FileExtension.JS }
  static getModuleType(type: TemplateType) {
    return MODULE_TYPE_TO_KIND[type] ?? ModuleKind.ES_MODULE
  }

  // ============ 缓存 ============

  static async readData(projectPath: string, output: string) {
    const key = cacheKey(projectPath, output)
    const cached = TemplateHelper._cacheData.get(key)
    if (cached)
      return cached
    try {
      const data = await readCacheApis(projectPath, output)
      if (!data) {
        TemplateHelper._cacheData.delete(key)
        return null
      }
      TemplateHelper._cacheData.set(key, data)
      return data
    }
    catch {
      TemplateHelper._cacheData.delete(key)
      return null
    }
  }

  static getData(projectPath: string, output: string): CacheData | undefined {
    return TemplateHelper._cacheData.get(cacheKey(projectPath, output))
  }

  static async setData(templateData: TemplateData, projectPath: string, output: string, config?: GeneratorConfig) {
    TemplateHelper._cacheData.set(cacheKey(projectPath, output), {
      path: output,
      serverName: config?.serverName || templateData.title || '',
      apis: templateData.allApis || [],
    })
  }

  /** Flush all in-memory cache entries to disk using directory-based format. Only flushes entries belonging to the given projectPath. */
  static async flushAllData(projectPath: string) {
    const prefix = `${projectPath}::`
    for (const [key, cd] of TemplateHelper._cacheData) {
      if (!key.startsWith(prefix))
        continue
      const apis = cd.apis || []
      const hashInfo = computePerTagHashes(apis)
      await writeCacheEntry(projectPath, cd.path, cd.serverName || '', apis, hashInfo)
    }
  }

  // ============ unlink ============

  unlink(_files: Array<UnlickFile | string>, { output }: UnlickOptions) {
    const ext = this.getExt()
    const list: Required<UnlickFile>[] = _files.filter(Boolean).map(item =>
      typeof item === 'string' ? { fileName: item, output, ext } : Object.assign({ output, ext }, item),
    )
    return Promise.all(list.map(async ({ output, fileName, ext }) => {
      const p = path.join(output, `${fileName}${ext}`)
      if (await existsPromise(p))
        await fs.unlink(p)
    }))
  }

  // ============ 模板解析 ============

  async resolveTemplateFiles(templatePath: string): Promise<TemplateFileInfo[]> {
    const absolute = path.isAbsolute(templatePath) ? templatePath : path.resolve(process.cwd(), templatePath)
    if (!(await existsPromise(absolute)))
      throw logger.throwError(`Template path not found: ${absolute}`)
    if (await this.checkModuleTypeDirs(absolute)) {
      const mt = this.resolveModuleType()
      const md = path.join(absolute, mt)
      if (await existsPromise(md)) {
        logger.debug('Resolving template files via module-type dir', { moduleType: mt, templatePath: absolute })
        return this.scanDir(md, '')
      }
      const supported: string[] = []
      for (const m of MODULE_TYPES) {
        if (await existsPromise(path.join(absolute, m)))
          supported.push(m)
      }
      throw logger.throwError(`Template "${path.basename(absolute)}" does not support module type "${this.config.type}". Supported types: ${supported.join(', ')}`)
    }
    return this.scanAllTemplateDirs(absolute)
  }

  private async checkModuleTypeDirs(tpl: string) {
    for (const m of MODULE_TYPES) {
      const d = path.join(tpl, m)
      if (await existsPromise(d) && (await fs.stat(d)).isDirectory())
        return true
    }
    return false
  }

  private resolveModuleType(): ModuleTypeKey {
    const m: Record<string, ModuleTypeKey> = {
      [TemplateTypeEnum.TYPESCRIPT]: ModuleTypeDir.TYPESCRIPT,
      [TemplateTypeEnum.MODULE]: ModuleTypeDir.MODULE,
      commonjs: ModuleTypeDir.COMMON,
    }
    return m[this.config.type] ?? ModuleTypeDir.TYPESCRIPT
  }

  // ---- scan ----

  private async scanDir(dir: string, base: string, insideTagDir = false): Promise<TemplateFileInfo[]> {
    const out: TemplateFileInfo[] = []
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const fp = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === TemplateSkipDir.PARTIALS)
          continue
        if (e.name === TemplateSkipDir.TAG_DIR) {
          if (insideTagDir)
            throw logger.throwError(`Nested ${TemplatePlaceholder.TAG} directory is not allowed: "${joinPath(base, TemplatePlaceholder.TAG)}".`)
          out.push(...await this.scanDir(fp, joinPath(base, TemplatePlaceholder.TAG), true))
        }
        else {
          out.push(...await this.scanDir(fp, joinPath(base, e.name), insideTagDir))
        }
      }
      else if (e.isFile() && isTemplateFile(e.name)) {
        out.push(this.makeFileInfo(e.name, fp, base, insideTagDir))
      }
    }
    return out
  }

  private async scanAllTemplateDirs(tpl: string): Promise<TemplateFileInfo[]> {
    const out: TemplateFileInfo[] = []
    for (const e of await fs.readdir(tpl, { withFileTypes: true })) {
      const fp = path.join(tpl, e.name)
      if (e.isDirectory()) {
        if (e.name === TemplateSkipDir.PARTIALS)
          continue
        if (e.name === TemplateSkipDir.TAG_DIR)
          out.push(...await this.scanDir(fp, TemplatePlaceholder.TAG, true))
        else out.push(...await this.scanDir(fp, e.name))
      }
      else if (e.isFile() && isTemplateFile(e.name)) {
        out.push(this.makeFileInfo(e.name, fp, ''))
      }
    }
    return out
  }

  private makeFileInfo(rawName: string, absolutePath: string, base: string, insideTagDir = false): TemplateFileInfo {
    const { isNoOverwrite, name: actual } = parseEntryName(rawName)
    if (insideTagDir && actual.includes(TemplatePlaceholder.TAG))
      throw logger.throwError(`Nested ${TemplatePlaceholder.TAG} template not allowed: "${joinPath(base, actual)}".`)
    return {
      absolutePath,
      relativePath: base ? joinPath(base, actual) : actual,
      fileName: actual,
      isNoOverwrite,
      templateType: detectTemplateType(actual, !insideTagDir),
      insideTagDir,
    }
  }

  // ============ 渲染 & 输出 ============

  async renderTemplate(templateFilePath: string, data: any): Promise<string> {
    const p = path.isAbsolute(this.config.templatePath)
      ? path.join(this.config.templatePath, `${templateFilePath}${FileExtension.HANDLEBARS}`)
      : path.resolve(process.cwd(), this.config.templatePath, `${templateFilePath}${FileExtension.HANDLEBARS}`)
    if (await existsPromise(p)) {
      const hbs = await this.createHbs()
      return hbs.compile(await fs.readFile(p, 'utf-8'))(data)
    }
    throw logger.throwError(`Template not found: ${templateFilePath}`)
  }

  async renderTemplateFromPath(hbs: typeof HandlebarsType, absolutePath: string, data: any): Promise<string> {
    let template = templateCompileCache.get(absolutePath)
    if (!template) {
      template = hbs.compile(await fs.readFile(absolutePath, 'utf-8'))
      templateCompileCache.set(absolutePath, template)
    }
    return template(data)
  }

  /** M1-A2: 清除 Handlebars 编译和实例缓存（供测试与 watch 模式使用） */
  static clearTemplateCache() {
    hbsInstanceCache.clear()
    templateCompileCache.clear()
  }

  private async createHbs() {
    const cacheKey = this.config.templatePath
    const cached = hbsInstanceCache.get(cacheKey)
    if (cached) {
      logger.debug('Handlebars instance loaded from cache', { templatePath: cacheKey })
      return cached
    }

    logger.debug('Creating new Handlebars instance', { templatePath: cacheKey })
    const hbs = handlebars.create()
    registerCommonHelpers(hbs)
    await registerPartials(this.config.templatePath, hbs)
    if (this.config.onHandlebarsCreated?.length) {
      logger.debug('Running onHandlebarsCreated callbacks', { count: this.config.onHandlebarsCreated.length })
      for (const fn of this.config.onHandlebarsCreated) {
        if (typeof fn === 'function')
          await fn(hbs)
      }
    }

    hbsInstanceCache.set(cacheKey, hbs)
    return hbs
  }

  /**
   * 9.2.3: Private file writing — now internal to the streaming pipeline.
   * Prettier formatting applied at file level (9.5.2).
   */
  private async outputFiles(
    files: Record<string, string>,
    output: string,
    writeConcurrency = 32,
    prettierFinal = true,
  ) {
    const entries = Object.entries(files)
    if (!entries.length)
      return

    // Collect unique directories and create them
    const dirs = new Set<string>()
    for (const [rp] of entries) {
      const op = path.isAbsolute(rp) ? rp : path.join(output, rp)
      dirs.add(path.dirname(op))
    }
    await Promise.all(
      [...dirs].map(async (d) => {
        if (!(await existsPromise(d)))
          await fs.mkdir(d, { recursive: true })
      }),
    )

    // Batch concurrent writes to avoid too many file handles
    const concurrency = Math.max(1, writeConcurrency)
    for (let i = 0; i < entries.length; i += concurrency) {
      const batch = entries.slice(i, i + concurrency)
      await Promise.all(batch.map(async ([rp, content]) => {
        const op = path.isAbsolute(rp) ? rp : path.join(output, rp)
        // 9.5.2: Apply prettier at file level for .ts/.js files
        let finalContent = content
        if (prettierFinal && /\.(?:ts|js|mjs|cjs|tsx|jsx)$/.test(rp)) {
          try {
            finalContent = await format(content)
          }
          catch {
            // Prettier format failed, use original content
          }
        }
        return fs.writeFile(op, finalContent)
      }))
    }
    logger.debug('Batch file write complete', {
      total: entries.length,
      concurrency,
      prettierFinal,
      outputDir: output,
    })
  }

  // ============ generateFromTemplateDir (unified streaming pipeline) ============

  /**
   * 9.2.1 & 9.2.2: Unified streaming pipeline — the only generation method.
   * Renders per-tag files and writes them immediately, then renders global files.
   * Supports `beforeFileWrite` callback for plugin content modification (9.1.2).
   * Collects and returns all file paths for `codeGenerated` hook (9.1.1).
   */
  async generateFromTemplateDir(
    templatePath: string,
    outputDir: string,
    data: TemplateData,
    options?: {
      changedTags?: Set<string>
      /** 9.1.2: Called before each file write, return modified content */
      beforeFileWrite?: (params: {
        filePath: string
        content: string
        meta: { templateType?: 'tag' | 'api', tag?: string, api?: string }
      }) => MaybePromise<string>
      writeConcurrency?: number
      prettierFinal?: boolean
    },
  ): Promise<{ filePaths: string[] }> {
    const tpls = await this.resolveTemplateFiles(templatePath)
    if (!tpls.length)
      throw logger.throwError(`No template files found in: ${templatePath}`)

    const totalTemplates = tpls.length
    const tagTemplates = tpls.filter(f => f.templateType === 'tag').length
    const apiTemplates = tpls.filter(f => f.templateType === 'api').length
    const staticTemplates = totalTemplates - tagTemplates - apiTemplates
    logger.debug('Template files resolved', {
      total: totalTemplates,
      tagTemplates,
      apiTemplates,
      staticTemplates,
    })

    const { changedTags, beforeFileWrite, writeConcurrency = 32, prettierFinal = true } = options ?? {}

    const hbs = await this.createHbs()
    const tags = data.tagedApis?.map(item => item.tagName) || []
    const apis = data.allApis || []
    const tagApisMap = new Map<string, typeof data.tagedApis[0]>()
    data.tagedApis?.forEach(item => tagApisMap.set(item.tagName, item))

    // Collect all file paths for codeGenerated notification
    const allFilePaths: string[] = []

    // --- Phase 1: Per-tag streaming (render → collect → batch write) ---
    const nonDirTagTpls = tpls.filter(f => !f.insideTagDir && f.templateType === 'tag')
    const dirTpls = tpls.filter(f => f.insideTagDir)

    const effectiveTags = changedTags ? tags.filter(t => changedTags.has(t)) : tags
    let tagFilesWritten = 0
    logger.debug('Phase 1: Per-tag streaming', {
      totalTags: tags.length,
      effectiveTags: effectiveTags.length,
      changedMode: !!changedTags,
    })

    // P1: Collect all per-tag files across all tags, then write in ONE batch.
    // Previously each tag wrote its files immediately via outputFiles(), which
    // meant 35+ small sequential write batches instead of one fully-concurrent batch.
    const allTagFiles: Record<string, string> = {}

    for (const tag of effectiveTags) {
      const tagApis = tagApisMap.get(tag)
      if (!tagApis)
        continue

      const tagFiles: Record<string, string> = {}
      const ctx = { ...data, tagedApis: [tagApis], currentTag: tagApis }

      for (const tf of nonDirTagTpls) {
        Object.assign(tagFiles, await this.renderOne(hbs, tf, ctx, outputDir, { tag, api: undefined }))
      }
      for (const tf of dirTpls) {
        if (tf.templateType === 'api') {
          await this.expandByApi(hbs, tf, ctx, tagApis.apis, api => ({ ...ctx, currentApi: api }), tagFiles, outputDir, tag)
        }
        else {
          Object.assign(tagFiles, await this.renderOne(hbs, tf, ctx, outputDir, { tag, api: undefined }))
        }
      }

      // Apply beforeFileWrite with per-tag metadata, then collect into allTagFiles
      if (beforeFileWrite) {
        for (const [rp, content] of Object.entries(tagFiles)) {
          tagFiles[rp] = await beforeFileWrite({
            filePath: rp,
            content,
            meta: { templateType: 'tag', tag, api: undefined },
          })
        }
      }
      // Collect paths for codeGenerated notification
      for (const rp of Object.keys(tagFiles)) {
        const op = path.isAbsolute(rp) ? rp : path.resolve(outputDir, rp)
        allFilePaths.push(op)
      }
      Object.assign(allTagFiles, tagFiles)
      tagFilesWritten += Object.keys(tagFiles).length
    }

    // P1: Single batch write for ALL per-tag files — fully utilizes writeConcurrency
    if (Object.keys(allTagFiles).length) {
      await this.outputFiles(allTagFiles, outputDir, writeConcurrency, prettierFinal)
    }

    logger.debug('Phase 1 complete', { tagFilesWritten })

    // --- Phase 2: Global files (API-level + non-tag templates) ---
    const globalFiles: Record<string, string> = {}
    const globalTpls = tpls.filter(f => !f.insideTagDir)
    logger.debug('Phase 2: Global files', { globalTemplateCount: globalTpls.length })
    for (const tf of globalTpls) {
      if (tf.templateType === 'tag' && tags.length)
        continue
      if (tf.templateType === 'api' && apis.length) {
        await this.expandByApi(hbs, tf, data, apis, api => api, globalFiles, outputDir)
      }
      else if (tf.templateType !== 'tag') {
        Object.assign(globalFiles, await this.renderOne(hbs, tf, data, outputDir))
      }
    }

    await this.applyHooksAndWrite(globalFiles, outputDir, beforeFileWrite, undefined, undefined, undefined, writeConcurrency, prettierFinal, allFilePaths)

    logger.debug('Phase 2 complete', { globalFilesWritten: Object.keys(globalFiles).length })
    logger.debug('Generation summary', { totalOutputFiles: allFilePaths.length })
    return { filePaths: allFilePaths }
  }

  private async applyHooksAndWrite(
    files: Record<string, string>,
    outputDir: string,
    beforeFileWrite: ((params: any) => MaybePromise<string>) | undefined,
    templateType: 'tag' | 'api' | undefined,
    tag: string | undefined,
    api: string | undefined,
    writeConcurrency: number,
    prettierFinal: boolean,
    allFilePaths: string[],
  ) {
    if (beforeFileWrite) {
      // Apply beforeFileWrite to each file sequentially for determinism
      for (const [rp, content] of Object.entries(files)) {
        const newContent = await beforeFileWrite({
          filePath: rp,
          content,
          meta: { templateType, tag, api },
        })
        files[rp] = newContent
      }
    }
    // Collect paths
    for (const rp of Object.keys(files)) {
      const op = path.isAbsolute(rp) ? rp : path.resolve(outputDir, rp)
      allFilePaths.push(op)
    }
    await this.outputFiles(files, outputDir, writeConcurrency, prettierFinal)
  }

  private async expandByApi(hbs: typeof HandlebarsType, tf: TemplateFileInfo, _data: any, apis: any[], ctxFn: (api: any) => any, out: Record<string, string>, outputDir: string, tag?: string) {
    for (const api of apis) {
      Object.assign(out, await this.renderOne(hbs, tf, ctxFn(api), outputDir, { tag, api: api.name }))
    }
  }

  private async renderOne(hbs: typeof HandlebarsType, tf: TemplateFileInfo, data: any, outputDir: string, placeholders?: { tag?: string, api?: string }): Promise<Record<string, string>> {
    const renderData = data.config ? { ...data.config, ...data } : data
    const content = await this.renderTemplateFromPath(hbs, tf.absolutePath, renderData)

    let relPath = tf.relativePath
    if (placeholders?.tag)
      relPath = relPath.replace(TemplatePlaceholder.TAG, placeholders.tag)
    if (placeholders?.api)
      relPath = relPath.replace(TemplatePlaceholder.API, placeholders.api)
    relPath = stripExt(normalizeSlashes(relPath))

    if (tf.isNoOverwrite && await existsPromise(path.join(outputDir, relPath)))
      return {}

    return { [relPath]: `${content.trim()}\n` }
  }
}

export const templateHelper = TemplateHelper.getInstance()
