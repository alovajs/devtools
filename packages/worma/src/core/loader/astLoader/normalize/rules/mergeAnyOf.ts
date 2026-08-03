import type { SchemaObject } from '@/type'

/**
 * Detect whether two schemas form a discriminator on a shared property.
 * When different branches use different const or enum values for the same field,
 * merging them would lose the discriminant information, so they should be kept
 * as separate union branches.
 */
function hasDiscriminatorConflict(a: SchemaObject, b: SchemaObject): boolean {
  const aProps = (a.properties ?? {}) as Record<string, SchemaObject>
  const bProps = (b.properties ?? {}) as Record<string, SchemaObject>
  for (const key of Object.keys(aProps)) {
    if (!(key in bProps)) {
      continue
    }
    const ap = aProps[key]
    const bp = bProps[key]
    // different const values -> discriminator
    if (ap.const !== undefined && bp.const !== undefined && ap.const !== bp.const) {
      return true
    }
    // one const, one enum -> discriminator
    if ((ap.const !== undefined && bp.enum) || (bp.const !== undefined && ap.enum)) {
      return true
    }
    // different enum values -> discriminator
    if (ap.enum && bp.enum) {
      const aKey = JSON.stringify([...(ap.enum as any[])].sort())
      const bKey = JSON.stringify([...(bp.enum as any[])].sort())
      if (aKey !== bKey) {
        return true
      }
    }
  }
  return false
}

/**
 * A group is considered to have a conflict if any two of its branches have a discriminator conflict.
 */
function groupHasDiscriminatorConflict(group: SchemaObject[]): boolean {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (hasDiscriminatorConflict(group[i], group[j])) {
        return true
      }
    }
  }
  return false
}

export default function mergeAnyOf(schema: SchemaObject): SchemaObject | void {
  if (!schema.anyOf || schema.anyOf.length < 2) {
    return
  }
  const typeMap = new Map<string, SchemaObject[]>()
  for (const sub of schema.anyOf) {
    const t = (sub as SchemaObject).type
    const typeKey = Array.isArray(t) ? t.join(',') : String(t)
    if (!typeMap.has(typeKey))
      typeMap.set(typeKey, [])
    typeMap.get(typeKey)!.push(sub as SchemaObject)
  }
  const mergedAnyOf: SchemaObject[] = []
  for (const group of typeMap.values()) {
    if (group.length === 1) {
      mergedAnyOf.push(group[0])
      continue
    }

    // if any discriminator conflict exists within the group, keep the original branches unmerged
    if (groupHasDiscriminatorConflict(group)) {
      mergedAnyOf.push(...group)
      continue
    }

    const merged: Record<string, any> = { type: group[0].type }
    for (const sub of group) {
      for (const [key, value] of Object.entries(sub)) {
        if (key === 'type')
          continue
        if (merged[key] === undefined) {
          merged[key] = value
        }
        else if (Array.isArray(merged[key]) && Array.isArray(value)) {
          merged[key] = Array.from(new Set([...merged[key], ...value]))
        }
        else if (typeof merged[key] === 'object' && typeof value === 'object') {
          merged[key] = { ...merged[key], ...value }
        }
      }
    }
    mergedAnyOf.push(merged as SchemaObject)
  }
  if (mergedAnyOf.length === schema.anyOf.length && mergedAnyOf.every((s, i) => s === schema.anyOf![i])) {
    return
  }
  return { ...schema, anyOf: mergedAnyOf } as SchemaObject
}
