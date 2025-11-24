import type { VersionType } from '@changesets/types'
import fs from 'node:fs'
import path from 'node:path'

const RELEASE_PLAN_FILE = path.join('.changeset', '.release-plan.json')

export interface ReleasePlan {
  name: string
  version: string
  type: VersionType
}
export function saveReleasePlan(plan: ReleasePlan[]) {
  // 确保 node_modules 存在（某些 CI 情况可能不存在）
  if (!fs.existsSync('node_modules')) {
    fs.mkdirSync('node_modules')
  }

  fs.writeFileSync(
    RELEASE_PLAN_FILE,
    JSON.stringify(plan, null, 2),
    'utf8',
  )

  console.log(`✔ Release plan saved to ${RELEASE_PLAN_FILE}`)
}

export function loadReleasePlan() {
  if (!fs.existsSync(RELEASE_PLAN_FILE)) {
    return []
  }

  const content = fs.readFileSync(RELEASE_PLAN_FILE, 'utf8').trim()
  // 处理content非法的情况：1. content为空 2. content不是数组 3.JSON.parse 失败。
  // 统一返回空数组
  try {
    return JSON.parse(content || '[]') as ReleasePlan[]
  }
  catch (error) {
    console.error(`❌ Failed to parse release plan file: ${RELEASE_PLAN_FILE}\n${error}`)
    return []
  }
}

export function deleteReleasePlan() {
  if (fs.existsSync(RELEASE_PLAN_FILE)) {
    fs.unlinkSync(RELEASE_PLAN_FILE)
    console.log(`✔ Deleted ${RELEASE_PLAN_FILE}`)
  }
}

export function releasePlanPath() {
  return RELEASE_PLAN_FILE
}
