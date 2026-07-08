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

function normalizeMarketplaceVersion(pkgName: string): boolean {
  // VS Marketplace / OpenVSX 扩展版本号仅支持 major.minor.patch，不接受 semver 预发布标签。
  // 规则：取 major.minor，并将 beta.x 中的 x 作为 patch。例如 1.0.0-beta.1 -> 1.0.1
  let pkgFile = ''
  fg.sync(['packages/*/package.json'], { cwd: process.cwd(), absolute: true }).forEach((file) => {
    try {
      const j = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, any>
      if (j.name === pkgName)
        pkgFile = file
    }
    catch {
      // ignore
    }
  })
  if (!pkgFile)
    return false
  const json = JSON.parse(fs.readFileSync(pkgFile, 'utf8')) as Record<string, any>
  const version = String(json.version)
  const match = version.match(/^(\d+)\.(\d+)\.\d+-beta\.(\d+)$/)
  if (!match)
    return false
  const next = `${match[1]}.${match[2]}.${match[3]}`
  json.version = next
  fs.writeFileSync(pkgFile, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`🔧 规整扩展版本: ${version} -> ${next}（不提交）`)
  return true
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
    if (isPre) {
      // 扩展预发布：将 beta.x 的 x 作为 patch，仅保留 major.minor.patch
      normalizeMarketplaceVersion(name)
    }
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
