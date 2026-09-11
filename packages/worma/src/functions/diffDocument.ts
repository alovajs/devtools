/**
 * Structural diff of the **source** OpenAPI document.
 *
 * The baseline is the document parsed from the `beforeSpecParse` output, i.e.
 * taken *before* the `specParsed` hooks run: it is the source file as authored,
 * not the plugin-normalised document that generation consumes. Every difference
 * is reported as a flat {@link SourceChange} row so a caller (the CLI table, the
 * editor webview, a CI script) can render it without any further shaping.
 *
 * Design notes:
 * - `$ref`s are deliberately **not** inlined: the record is a source view, so a
 *   component change is reported once under `#/components/...`, with the
 *   affected operations attached as `affects` (resolved through the reverse
 *   `$ref` index, including transitive references) so the impact stays visible
 *   without duplicating the row.
 * - Description-ish keys are still recorded (they are source changes) but get
 *   the `doc` level so callers can de-emphasise them.
 */

/** Category of a change row. */
export type ChangeKind = 'api' | 'param' | 'body' | 'resp' | 'comp' | 'meta'

/** `+` added, `-` removed, `~` modified. */
export type ChangeOp = '+' | '-' | '~'

/** Coarse severity, used for ordering and colour only. */
export type ChangeLevel = 'breaking' | 'additive' | 'doc'

/** One flattened source-document change. */
export interface SourceChange {
  op: ChangeOp
  kind: ChangeKind
  /** `GET /pets`, `#/components/schemas/Pet` or `#/info` */
  target: string
  /** Location inside the target, e.g. `query.status.schema.enum` */
  item?: string
  /** Short description, e.g. `createPet -> addPet` or `+"sold"` */
  detail?: string
  level: ChangeLevel
  /**
   * Operations affected by a `comp` change, rendered as a list next to the
   * change (one per line). Always absent for non-component kinds.
   */
  affects?: string[]
}

/** HTTP methods recognised as operations inside a path item. */
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

/** Component sections compared by key. */
const COMPONENT_SECTIONS = [
  'schemas',
  'parameters',
  'requestBodies',
  'responses',
  'headers',
  'securitySchemes',
  'links',
  'callbacks',
  'examples',
] as const

/** Keys whose change is documentation-only. */
const DOC_KEYS = new Set(['description', 'title', 'summary', 'example', 'examples', 'externalDocs', 'deprecated'])

/** Recursion guard for deeply nested schemas. */
const MAX_DEPTH = 8
/** Row cap: a pathological spec must not produce an unbounded record. */
const MAX_ROWS = 1000

// ──────────────────────────────────────────────────────────────
// Change collection
// ──────────────────────────────────────────────────────────────

class ChangeCollector {
  readonly changes: SourceChange[] = []
  truncated = false

  push(target: string, kind: ChangeKind, change: Omit<SourceChange, 'target' | 'kind'>): void {
    if (this.changes.length >= MAX_ROWS) {
      this.truncated = true
      return
    }
    this.changes.push({ ...change, target, kind })
  }

  /** Finalise the row list, appending a marker when the cap was hit. */
  finish(): SourceChange[] {
    if (this.truncated) {
      this.changes.push({
        op: '~',
        kind: 'meta',
        target: '(truncated)',
        item: '',
        detail: `more than ${MAX_ROWS} changes`,
        level: 'doc',
      })
    }
    return this.changes
  }
}

/** Everything `diffValue` needs to emit a row. */
interface DiffContext {
  collector: ChangeCollector
  target: string
  kind: ChangeKind
}

// ──────────────────────────────────────────────────────────────
// Value helpers
// ──────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isRefObject(value: unknown): boolean {
  return isObject(value) && typeof value.$ref === 'string'
}

function isPrimitive(value: unknown): boolean {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asObject(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {}
}

/** Sorted union of two objects' keys — keeps the record deterministic. */
function unionKeys(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
}

/** Sorted union of two maps' keys. */
function unionMapKeys(a: Map<string, unknown>, b: Map<string, unknown>): string[] {
  return [...new Set([...a.keys(), ...b.keys()])].sort()
}

function joinPath(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key
}

/** Shallow copy without the given keys. */
function omit(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source)) {
    if (!keys.includes(key))
      result[key] = source[key]
  }
  return result
}

function stableKey(value: unknown): string {
  return JSON.stringify(value) ?? 'null'
}

/** Short, single-line preview of a value for the `detail` column. */
function summarize(value: unknown): string {
  if (value === undefined)
    return '-'
  if (value === null)
    return 'null'
  if (Array.isArray(value)) {
    if (value.length <= 4 && value.every(isPrimitive))
      return JSON.stringify(value)
    return `array(${value.length})`
  }
  if (isObject(value)) {
    const keys = Object.keys(value)
    return `{${keys.slice(0, 4).join(', ')}${keys.length > 4 ? ', ...' : ''}}`
  }
  return JSON.stringify(value) ?? String(value)
}

/**
 * Severity of a leaf change.
 *
 * `required`/`enum` are treated per direction because their set semantics are
 * asymmetric: a newly required field breaks callers, a relaxed one does not; a
 * new enum value is compatible, a removed one is not.
 */
function levelFor(key: string, op: ChangeOp): ChangeLevel {
  if (DOC_KEYS.has(key) || key.startsWith('x-'))
    return 'doc'
  if (key === 'required')
    return op === '+' ? 'breaking' : 'additive'
  return op === '+' ? 'additive' : 'breaking'
}

// ──────────────────────────────────────────────────────────────
// Generic recursive differ
// ──────────────────────────────────────────────────────────────

/**
 * Recursively diff two JSON-ish values, emitting one row per changed leaf.
 *
 * - objects: key union (covers `properties`, where keys are property names)
 * - primitive arrays: set semantics (covers `enum`, `required`, `type`)
 * - object arrays: index semantics (covers `allOf`/`oneOf`/`security`/`servers`)
 */
function diffValue(ctx: DiffContext, before: unknown, after: unknown, pointer: string, key: string, depth = 0): void {
  if (ctx.collector.truncated || stableKey(before) === stableKey(after))
    return

  if (depth > MAX_DEPTH) {
    ctx.collector.push(ctx.target, ctx.kind, {
      op: '~',
      item: pointer,
      detail: `${summarize(before)} -> ${summarize(after)}`,
      level: levelFor(key, '~'),
    })
    return
  }

  if (isObject(before) && isObject(after)) {
    for (const childKey of unionKeys(before, after)) {
      const hasBefore = childKey in before
      const hasAfter = childKey in after
      const childPointer = joinPath(pointer, childKey)
      if (!hasBefore) {
        ctx.collector.push(ctx.target, ctx.kind, {
          op: '+',
          item: childPointer,
          detail: summarize(after[childKey]),
          level: levelFor(childKey, '+'),
        })
      }
      else if (!hasAfter) {
        ctx.collector.push(ctx.target, ctx.kind, {
          op: '-',
          item: childPointer,
          detail: summarize(before[childKey]),
          level: levelFor(childKey, '-'),
        })
      }
      else {
        diffValue(ctx, before[childKey], after[childKey], childPointer, childKey, depth + 1)
      }
    }
    return
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    if (before.every(isPrimitive) && after.every(isPrimitive)) {
      const beforeSet = new Set(before.map(stableKey))
      const afterSet = new Set(after.map(stableKey))
      for (const item of after) {
        if (!beforeSet.has(stableKey(item))) {
          ctx.collector.push(ctx.target, ctx.kind, { op: '+', item: pointer, detail: `+${summarize(item)}`, level: levelFor(key, '+') })
        }
      }
      for (const item of before) {
        if (!afterSet.has(stableKey(item))) {
          ctx.collector.push(ctx.target, ctx.kind, { op: '-', item: pointer, detail: `-${summarize(item)}`, level: levelFor(key, '-') })
        }
      }
      return
    }

    const length = Math.max(before.length, after.length)
    for (let i = 0; i < length; i++) {
      const childPointer = `${pointer}[${i}]`
      if (i >= before.length) {
        ctx.collector.push(ctx.target, ctx.kind, { op: '+', item: childPointer, detail: summarize(after[i]), level: levelFor(key, '+') })
      }
      else if (i >= after.length) {
        ctx.collector.push(ctx.target, ctx.kind, { op: '-', item: childPointer, detail: summarize(before[i]), level: levelFor(key, '-') })
      }
      else {
        diffValue(ctx, before[i], after[i], childPointer, key, depth + 1)
      }
    }
    return
  }

  ctx.collector.push(ctx.target, ctx.kind, {
    op: '~',
    item: pointer,
    detail: `${summarize(before)} -> ${summarize(after)}`,
    level: levelFor(key, '~'),
  })
}

// ──────────────────────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────────────────────

interface OperationEntry {
  key: string
  operation: Record<string, unknown>
  pathItem: Record<string, unknown>
}

function collectOperations(doc: Record<string, unknown>): Map<string, OperationEntry> {
  const result = new Map<string, OperationEntry>()
  const paths = asObject(doc.paths)
  for (const path of Object.keys(paths).sort()) {
    const pathItem = asObject(paths[path])
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!isObject(operation))
        continue
      const key = `${method.toUpperCase()} ${path}`
      result.set(key, { key, operation, pathItem })
    }
  }
  return result
}

function operationName(entry: OperationEntry): string | undefined {
  return typeof entry.operation.operationId === 'string' ? entry.operation.operationId : undefined
}

function parameterKey(parameter: unknown): string {
  if (isRefObject(parameter))
    return `ref:${String(asObject(parameter).$ref)}`
  const object = asObject(parameter)
  return `${String(object.in ?? '')}:${String(object.name ?? '')}`
}

function parameterLabel(parameter: unknown): string {
  if (isRefObject(parameter)) {
    const ref = String(asObject(parameter).$ref)
    return ref.replace('#/components/', '')
  }
  const object = asObject(parameter)
  return `${String(object.in ?? '')}.${String(object.name ?? '')}`
}

function parameterSummary(parameter: unknown): string | undefined {
  const object = asObject(parameter)
  if (isRefObject(parameter))
    return String(object.$ref)
  const schema = asObject(object.schema)
  const type = schema.type ?? object.type
  const text = Array.isArray(type) ? type.join(' | ') : (typeof type === 'string' ? type : undefined)
  if (!text)
    return undefined
  return object.required ? text : `${text}?`
}

/** Effective parameters of an operation: path-item level first, operation level wins. */
function parametersByKey(entry: OperationEntry): Map<string, unknown> {
  const map = new Map<string, unknown>()
  for (const parameter of [...asArray(entry.pathItem.parameters), ...asArray(entry.operation.parameters)])
    map.set(parameterKey(parameter), parameter)
  return map
}

function diffPaths(collector: ChangeCollector, before: Record<string, unknown>, after: Record<string, unknown>): void {
  const beforeOps = collectOperations(before)
  const afterOps = collectOperations(after)
  for (const key of unionMapKeys(beforeOps, afterOps)) {
    const beforeOp = beforeOps.get(key)
    const afterOp = afterOps.get(key)
    if (!beforeOp) {
      collector.push(key, 'api', { op: '+', detail: operationName(afterOp!), level: 'additive' })
      continue
    }
    if (!afterOp) {
      collector.push(key, 'api', { op: '-', detail: operationName(beforeOp), level: 'breaking' })
      continue
    }
    diffOperation(collector, beforeOp, afterOp)
  }
}

function diffOperation(collector: ChangeCollector, before: OperationEntry, after: OperationEntry): void {
  const target = after.key
  const ctx: DiffContext = { collector, target, kind: 'api' }
  // `parameters` / `requestBody` / `responses` have dedicated walkers below.
  diffValue(ctx, omit(before.operation, ['parameters', 'requestBody', 'responses']), omit(after.operation, ['parameters', 'requestBody', 'responses']), '', 'operation')

  const paramCtx: DiffContext = { collector, target, kind: 'param' }
  const beforeParams = parametersByKey(before)
  const afterParams = parametersByKey(after)
  for (const key of unionMapKeys(beforeParams, afterParams)) {
    const beforeParam = beforeParams.get(key)
    const afterParam = afterParams.get(key)
    if (beforeParam === undefined) {
      collector.push(target, 'param', {
        op: '+',
        item: parameterLabel(afterParam),
        detail: parameterSummary(afterParam),
        level: asObject(afterParam).required ? 'breaking' : 'additive',
      })
      continue
    }
    if (afterParam === undefined) {
      collector.push(target, 'param', { op: '-', item: parameterLabel(beforeParam), level: 'breaking' })
      continue
    }
    diffValue(paramCtx, beforeParam, afterParam, parameterLabel(afterParam), 'parameter')
  }

  diffRequestBody(collector, target, before.operation.requestBody, after.operation.requestBody)
  diffResponses(collector, target, before.operation.responses, after.operation.responses)
}

function diffRequestBody(collector: ChangeCollector, target: string, before: unknown, after: unknown): void {
  if (before === undefined && after === undefined)
    return
  const ctx: DiffContext = { collector, target, kind: 'body' }
  if (!isObject(before)) {
    collector.push(target, 'body', { op: '+', item: 'requestBody', detail: summarize(after), level: 'additive' })
    return
  }
  if (!isObject(after)) {
    collector.push(target, 'body', { op: '-', item: 'requestBody', detail: summarize(before), level: 'breaking' })
    return
  }
  if (isRefObject(before) || isRefObject(after)) {
    diffValue(ctx, before, after, 'requestBody', 'requestBody')
    return
  }
  diffValue(ctx, omit(before, ['content']), omit(after, ['content']), 'requestBody', 'requestBody')
  diffContent(ctx, before.content, after.content, 'requestBody')
}

function diffResponses(collector: ChangeCollector, target: string, before: unknown, after: unknown): void {
  const beforeResponses = asObject(before)
  const afterResponses = asObject(after)
  const ctx: DiffContext = { collector, target, kind: 'resp' }
  for (const code of unionKeys(beforeResponses, afterResponses)) {
    const pointer = `responses.${code}`
    const beforeResponse = beforeResponses[code]
    const afterResponse = afterResponses[code]
    if (beforeResponse === undefined) {
      collector.push(target, 'resp', { op: '+', item: pointer, detail: summarize(afterResponse), level: 'additive' })
      continue
    }
    if (afterResponse === undefined) {
      collector.push(target, 'resp', { op: '-', item: pointer, detail: summarize(beforeResponse), level: 'breaking' })
      continue
    }
    if (isRefObject(beforeResponse) || isRefObject(afterResponse)) {
      diffValue(ctx, beforeResponse, afterResponse, pointer, 'responses')
      continue
    }
    diffValue(ctx, omit(asObject(beforeResponse), ['content']), omit(asObject(afterResponse), ['content']), pointer, 'response')
    diffContent(ctx, asObject(beforeResponse).content, asObject(afterResponse).content, pointer)
  }
}

/**
 * Diff a `content` map media type by media type.
 *
 * `schema` is walked without its own path segment so the rows read
 * `requestBody.application/json.properties.name.type` instead of nesting the
 * `schema` keyword into every pointer.
 */
function diffContent(ctx: DiffContext, before: unknown, after: unknown, prefix: string): void {
  const beforeContent = asObject(before)
  const afterContent = asObject(after)
  for (const mediaType of unionKeys(beforeContent, afterContent)) {
    const pointer = `${prefix}.${mediaType}`
    const beforeMedia = beforeContent[mediaType]
    const afterMedia = afterContent[mediaType]
    if (beforeMedia === undefined) {
      ctx.collector.push(ctx.target, ctx.kind, { op: '+', item: pointer, detail: summarize(afterMedia), level: 'additive' })
      continue
    }
    if (afterMedia === undefined) {
      ctx.collector.push(ctx.target, ctx.kind, { op: '-', item: pointer, detail: summarize(beforeMedia), level: 'breaking' })
      continue
    }
    diffValue(ctx, omit(asObject(beforeMedia), ['schema']), omit(asObject(afterMedia), ['schema']), pointer, 'content')
    diffValue(ctx, asObject(beforeMedia).schema, asObject(afterMedia).schema, pointer, 'schema')
  }
}

// ──────────────────────────────────────────────────────────────
// Components (with reverse-`$ref` impact resolution)
// ──────────────────────────────────────────────────────────────

class RefIndex {
  private opsByRef = new Map<string, Set<string>>()
  private parents = new Map<string, Set<string>>()

  static build(doc: Record<string, unknown>): RefIndex {
    const index = new RefIndex()
    const paths = asObject(doc.paths)
    for (const path of Object.keys(paths)) {
      const pathItem = asObject(paths[path])
      for (const method of HTTP_METHODS) {
        if (!isObject(pathItem[method]))
          continue
        const operationKey = `${method.toUpperCase()} ${path}`
        for (const ref of collectRefs([pathItem[method], pathItem.parameters]))
          index.addTo(index.opsByRef, ref, operationKey)
      }
    }

    const components = asObject(doc.components)
    for (const section of COMPONENT_SECTIONS) {
      const group = asObject(components[section])
      for (const name of Object.keys(group)) {
        const ref = `#/components/${section}/${name}`
        for (const inner of collectRefs(group[name]))
          index.addTo(index.parents, inner, ref)
      }
    }
    return index
  }

  private addTo(map: Map<string, Set<string>>, key: string, value: string): void {
    const set = map.get(key) ?? new Set<string>()
    set.add(value)
    map.set(key, set)
  }

  /** Operations affected by a component, following transitive references. */
  affectedBy(ref: string): string[] {
    const operations = new Set<string>()
    const visited = new Set<string>()
    const queue = [ref]
    while (queue.length) {
      const current = queue.shift()!
      if (visited.has(current))
        continue
      visited.add(current)
      for (const operation of this.opsByRef.get(current) ?? [])
        operations.add(operation)
      for (const parent of this.parents.get(current) ?? [])
        queue.push(parent)
    }
    return [...operations].sort()
  }
}

/** Collect every `$ref` string inside a value. */
function collectRefs(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value)
      collectRefs(item, out)
    return out
  }
  if (isObject(value)) {
    if (typeof value.$ref === 'string')
      out.push(value.$ref)
    for (const key of Object.keys(value))
      collectRefs(value[key], out)
  }
  return out
}

/**
 * Emit one component change.
 *
 * The component ref is the row target, the changed field its `item`, and the
 * affected operations travel in `affects` so a renderer can list them next to
 * the change (the CLI prints one per line) instead of duplicating the row.
 */
function emitComponentChange(
  collector: ChangeCollector,
  ref: string,
  affected: string[],
  change: Omit<SourceChange, 'target' | 'kind' | 'affects'>,
): void {
  collector.push(ref, 'comp', { ...change, affects: affected.length > 0 ? affected : undefined })
}

function diffComponents(collector: ChangeCollector, before: Record<string, unknown>, after: Record<string, unknown>): void {
  const beforeComponents = asObject(before.components)
  const afterComponents = asObject(after.components)
  const beforeRefs = RefIndex.build(before)
  const afterRefs = RefIndex.build(after)

  for (const section of COMPONENT_SECTIONS) {
    const beforeGroup = asObject(beforeComponents[section])
    const afterGroup = asObject(afterComponents[section])
    for (const name of unionKeys(beforeGroup, afterGroup)) {
      const ref = `#/components/${section}/${name}`
      const beforeValue = beforeGroup[name]
      const afterValue = afterGroup[name]
      if (beforeValue === undefined) {
        emitComponentChange(collector, ref, afterRefs.affectedBy(ref), { op: '+', detail: summarize(afterValue), level: 'additive' })
        continue
      }
      if (afterValue === undefined) {
        emitComponentChange(collector, ref, beforeRefs.affectedBy(ref), { op: '-', detail: summarize(beforeValue), level: 'breaking' })
        continue
      }
      // Diff the component in place: the pointer starts empty so items read
      // `properties.status.enum` rather than repeating the component ref.
      const local = new ChangeCollector()
      diffValue({ collector: local, target: ref, kind: 'comp' }, beforeValue, afterValue, '', name)
      const affected = afterRefs.affectedBy(ref)
      for (const change of local.changes) {
        const { target: _target, kind: _kind, ...rest } = change
        emitComponentChange(collector, ref, affected, rest)
      }
      if (local.truncated)
        collector.truncated = true
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Document-global keys
// ──────────────────────────────────────────────────────────────

function diffRoot(collector: ChangeCollector, before: Record<string, unknown>, after: Record<string, unknown>): void {
  for (const key of unionKeys(before, after)) {
    if (key === 'paths' || key === 'components')
      continue
    const target = `#/${key}`
    if (!(key in after)) {
      collector.push(target, 'meta', { op: '-', item: key, detail: summarize(before[key]), level: 'breaking' })
      continue
    }
    if (!(key in before)) {
      collector.push(target, 'meta', { op: '+', item: key, detail: summarize(after[key]), level: 'additive' })
      continue
    }
    diffValue({ collector, target, kind: 'meta' }, before[key], after[key], key, key)
  }
}

// ──────────────────────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────────────────────

/**
 * Diff two source documents and return the flattened change rows.
 *
 * Returns an empty array when the documents are structurally identical, so the
 * caller can decide not to write a change record at all.
 */
export function diffSourceDocument(before: unknown, after: unknown): SourceChange[] {
  const collector = new ChangeCollector()
  const beforeDoc = asObject(before)
  const afterDoc = asObject(after)
  diffPaths(collector, beforeDoc, afterDoc)
  diffComponents(collector, beforeDoc, afterDoc)
  diffRoot(collector, beforeDoc, afterDoc)
  return collector.finish()
}
