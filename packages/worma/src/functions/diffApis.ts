import type { Api } from '@/type'
import { stableStringify } from '@/functions/wormaJson'

/** A newly added or removed API (identified by `method` + `path`). */
export interface ApiChange {
  method: string
  path: string
  name?: string
  tag?: string
}

/** An API that still exists but whose definition changed. */
export interface ApiFieldChange extends ApiChange {
  /** Names of the fields whose value differs between the two versions */
  changedFields: string[]
}

export interface ApiDiffResult {
  added: ApiChange[]
  removed: ApiChange[]
  modified: ApiFieldChange[]
}

/**
 * Fields compared when two APIs share the same `method` + `path` key.
 * `name` / `tag` are included so that renames and tag moves are reported
 * instead of being silently ignored.
 */
const COMPARED_FIELDS = [
  'name',
  'tag',
  'response',
  'requestBody',
  'queryParameters',
  'pathParameters',
] as const

/**
 * Stable matching key for an API.
 *
 * `method` + `path` is used instead of `name` because it survives function
 * renames: a renamed API is reported as *modified* rather than
 * removed + added.
 */
export function apiDiffKey(api: Pick<Api, 'method' | 'path'>): string {
  return `${String(api.method ?? '').toLowerCase()} ${api.path ?? ''}`
}

function toChange(api: Api): ApiChange {
  return {
    method: api.method,
    path: api.path,
    name: api.name,
    tag: api.tag,
  }
}

/**
 * Diff two API lists at API level.
 *
 * @param oldApis API list as of the previous generation (from cache)
 * @param newApis API list parsed from the current spec
 */
export function diffApis(oldApis: Api[] = [], newApis: Api[] = []): ApiDiffResult {
  const oldMap = new Map<string, Api>()
  for (const api of oldApis) {
    oldMap.set(apiDiffKey(api), api)
  }
  const newMap = new Map<string, Api>()
  for (const api of newApis) {
    newMap.set(apiDiffKey(api), api)
  }

  const added: ApiChange[] = []
  const removed: ApiChange[] = []
  const modified: ApiFieldChange[] = []

  for (const [key, api] of newMap) {
    if (!oldMap.has(key))
      added.push(toChange(api))
  }
  for (const [key, api] of oldMap) {
    if (!newMap.has(key))
      removed.push(toChange(api))
  }
  for (const [key, api] of newMap) {
    const previous = oldMap.get(key)
    if (!previous)
      continue
    const changedFields = COMPARED_FIELDS.filter(
      field => stableStringify(previous[field]) !== stableStringify(api[field]),
    )
    if (changedFields.length > 0) {
      modified.push({ ...toChange(api), changedFields: [...changedFields] })
    }
  }

  const byKey = (a: ApiChange, b: ApiChange) => apiDiffKey(a).localeCompare(apiDiffKey(b))
  added.sort(byKey)
  removed.sort(byKey)
  modified.sort(byKey)

  return { added, removed, modified }
}

/** Whether a diff result contains any change at all. */
export function hasApiChanges(diff: ApiDiffResult): boolean {
  return diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0
}
