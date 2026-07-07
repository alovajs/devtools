import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { deleteReleasePlan, loadReleasePlan, releasePlanPath } from './utils/release-plan'

function run(cmd: string) {
  execSync(cmd, { stdio: 'inherit' })
}

function getWorkspacePackageInfo() {
  const map = new Map<string, { private: boolean, hasReleaseScript: boolean }>()
  fg.sync(['packages/*/package.json'], { cwd: process.cwd(), absolute: true }).forEach((file) => {
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, any>
      const name = String(json.name ?? path.basename(path.dirname(file)))
      map.set(name, {
        private: Boolean(json.private),
        hasReleaseScript: Boolean(json.scripts && json.scripts.release),
      })
    }
    catch (error) {
      console.warn(`⚠ 读取包信息失败: ${file}\n${error}`)
    }
  })
  return map
}

function main() {
  const releasePlan = loadReleasePlan()
  const infoMap = getWorkspacePackageInfo()
  const names = Array.from(new Set(releasePlan.map(r => r.name)))
  const pub: string[] = []
  const pri: string[] = []

  for (const name of names) {
    const info = infoMap.get(name)
    if (!info) {
      console.warn(`⚠ 未找到包: ${name}`)
      continue
    }
    if (info.private) {
      if (info.hasReleaseScript) {
        pri.push(name)
      }
      else {
        console.warn(`⚠ 私有包 ${name} 未定义 release 命令`)
      }
    }
    else {
      pub.push(name)
    }
  }
  if (!pub.length && !pri.length) {
    return
  }

  run('pnpm -w build')

  if (pub.length) {
    console.log(`🚀 changeset publish：${pub.join(', ')}`)
    run('pnpm -w changeset publish')
  }
  for (const name of pri) {
    const plan = releasePlan.find(r => r.name === name)
    const isPre = plan ? plan.version.includes('-') : false
    console.log(`🚀 自定义发布：${name}${isPre ? '（prerelease）' : ''}（执行各自 release 命令）`)
    run(`pnpm -w --filter "${name}" run ${isPre ? 'release:pre' : 'release'}`)
  }
  // 删除文件
  if (!deleteReleasePlan()) {
    return
  }
  // 提交 commit（只有这个删除文件）
  run(`git add ${releasePlanPath()}`)
  run(`git commit -m "chore: remove .changeset/release-plan.json after publish"`)
  run(`git push`)
  console.log('✔ Release plan removed and committed.')
}

main()
