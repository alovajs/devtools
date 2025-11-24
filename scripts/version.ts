import { execSync } from 'node:child_process'
import getReleasePlan from '@changesets/get-release-plan'
import { saveReleasePlan } from './utils/release-plan'

async function main() {
  const releasePlan = await getReleasePlan(process.cwd())
  saveReleasePlan(releasePlan.releases.map(r => ({
    name: r.name,
    version: r.newVersion,
    type: r.type,
  })))

  execSync('changeset version', { stdio: 'inherit' })
}

main()
