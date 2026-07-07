import type { StandardLoader } from './index'
import type { OperationObject } from '@/type'

import { capitalizeFirstLetter, get$refName, strHashCode } from '@/utils'

export function getStandardOperationId(
  pathObject: OperationObject,
  options: {
    url: string
    method: string
    map: Set<string>
    standardLoader: StandardLoader
  },
): string {
  const { url, method, map, standardLoader } = options
  if (standardLoader.validate(pathObject.operationId)) {
    return pathObject.operationId as string
  }
  let operationId = ''
  if (pathObject.operationId) {
    operationId = standardLoader.transform(pathObject.operationId as string, {
      style: 'camelCase',
    })
  }
  if (!operationId) {
    operationId = standardLoader.transform(`${method}/${url}`, {
      style: 'snakeCase',
    })
  }
  if (map.has(operationId)) {
    let num = 1
    while (map.has(`${operationId}${num}`)) {
      num += 1
    }
    operationId = `${operationId}${num}`
  }
  map.add(operationId)
  return operationId
}
export function getStandardTags(
  tags: string[] | undefined | null,
  options: {
    standardLoader: StandardLoader
  },
) {
  const { standardLoader } = options
  const tagsSet = new Set<string>()
  if (!tags || !tags.length) {
    return ['general']
  }
  return tags.map((tag) => {
    tag = tag.trim()
    if (standardLoader.validate(tag)) {
      tagsSet.add(tag)
      return tag
    }
    let newTag = ''
    if (tag) {
      newTag = standardLoader.transform(tag, {
        style: 'camelCase',
      })
    }
    if (tagsSet.has(newTag)) {
      let num = 1
      while (tagsSet.has(`${newTag}${num}`)) {
        num += 1
      }
      newTag = `${newTag}${num}`
    }
    if (!newTag) {
      newTag = 'general'
    }
    tagsSet.add(newTag)
    return newTag
  })
}
export function getRandomVariable(value: string) {
  return `${strHashCode(value)}`
    .split('')
    .map((code) => {
      let numberCode = Number(code)
      numberCode = Number.isNaN(numberCode) ? 10 : numberCode
      return String.fromCharCode(numberCode + 97)
    })
    .join('')
}

const refPathMap = new Map<string, string>()
const refNameSet = new Set<string>()
export function getStandardRefName(
  refPath: string,
  options: {
    toUpperCase?: boolean
    standardLoader: StandardLoader
  },
) {
  const { toUpperCase = true, standardLoader } = options
  if (refPathMap.has(refPath)) {
    return refPathMap.get(refPath) ?? ''
  }
  const refName = get$refName(refPath, toUpperCase)
  if (standardLoader.validate(refName)) {
    refNameSet.add(refName)
    refPathMap.set(refPath, refName)
    return refName
  }
  let newRefName
    = standardLoader.transform(refName, {
      style: 'snakeCase',
    }) || getRandomVariable(refName)
  if (toUpperCase) {
    newRefName = capitalizeFirstLetter(newRefName)
  }
  if (refNameSet.has(newRefName)) {
    let num = 1
    while (refNameSet.has(`${newRefName}${num}`)) {
      num += 1
    }
    newRefName = `${newRefName}${num}`
  }
  refNameSet.add(newRefName)
  refPathMap.set(refPath, newRefName)
  return newRefName
}
