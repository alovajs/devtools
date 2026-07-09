/* eslint-disable no-console */
import { join } from 'node:path'
import { runTests } from '@vscode/test-electron'
import chalk from 'chalk'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { projectRoot, root } from './path'
import { logger, run } from './utils'

async function main() {
  const extensionDevelopmentPath = projectRoot

  // e2e is organized by *action*: each directory under `e2e-out/actions` is a
  // self-contained mocha suite exercising one extension action (command). The
  // action itself declares which example fixture(s) it needs via a co-located
  // `fixtures.js` (default `['commonjs']`). The harness only copies/installs the
  // declared examples and launches VSCode against them — we no longer iterate
  // over examples one by one. Which example to use is decided by the action.
  const actionsDir = join(projectRoot, './e2e-out/actions')
  const fixtureTempPath = join(root, './e2e-fixtures-temp')
  if (fs.existsSync(fixtureTempPath)) {
    await fs.remove(fixtureTempPath)
  }

  const actions = await fg('*', {
    onlyDirectories: true,
    cwd: actionsDir,
  })

  // Install each required example only once.
  const installed = new Set<string>()
  async function ensureFixture(example: string) {
    if (installed.has(example))
      return
    const fixtureSourcePath = join(root, 'examples', example)
    const fixtureTargetPath = join(fixtureTempPath, example)
    await fs.copy(fixtureSourcePath, fixtureTargetPath, {
      filter(src) {
        return !src.includes('node_modules')
      },
    })
    // Some example projects (e.g. `monorepo`) ship their own
    // `pnpm-workspace.yaml`. Inside the e2e harness fixtures are copied into a
    // sub-directory and installed with `pnpm i`; a nested workspace root would
    // prevent `workspace:*` dependencies (such as `wormajs`) from resolving to
    // the real package in the root workspace. Drop the nested workspace file so
    // the fixture installs as a standalone project linked to the root workspace.
    await fs.remove(join(fixtureTargetPath, 'pnpm-workspace.yaml')).catch(() => {})

    // Force the fixture to consume the LOCAL workspace `wormajs`
    // (`packages/worma`) instead of the published `latest`. The root
    // `pnpm-workspace.yaml` already declares `overrides.wormajs = "workspace:*"`,
    // but that override only takes effect for workspace members present at
    // root-install time. Because these fixtures are copied at runtime, a plain
    // `pnpm i` would otherwise resolve `wormajs` to the npm `latest` build —
    // which currently emits `require('worma')` — making the generated config
    // snapshot mismatch. Pinning every declared `wormajs` dependency to
    // `workspace:*` guarantees the e2e exercises the package under development
    // (whose template emits `require('wormajs')`, the v2.0 package name).
    const pkgFiles = await fg('**/package.json', {
      cwd: fixtureTargetPath,
      ignore: ['**/node_modules/**'],
      absolute: true,
    })
    for (const pkgFile of pkgFiles) {
      const pkg = await fs.readJson(pkgFile)
      let changed = false
      for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
        if (pkg[section] && typeof pkg[section].wormajs === 'string') {
          pkg[section].wormajs = 'workspace:*'
          changed = true
        }
      }
      if (changed)
        await fs.writeJson(pkgFile, pkg, { spaces: 2 })
    }

    // These fixtures are generated at runtime (gitignored) and are NOT present
    // in the committed `pnpm-lock.yaml`, so a frozen-lockfile install (the CI
    // default in pnpm 10) fails with ERR_PNPM_OUTDATED_LOCKFILE. Allow the
    // lockfile to be updated for the temporary fixture install.
    await run('pnpm i --no-frozen-lockfile', { cwd: fixtureTargetPath })
    installed.add(example)
  }

  try {
    for (const action of actions) {
      const extensionTestsPath = join(actionsDir, action, 'index')

      // Which example(s) does this action require?
      let fixtures: string[] = ['commonjs']
      try {
        const mod = await import(join(actionsDir, action, 'fixtures.js'))
        const value = mod.default ?? mod
        fixtures = Array.isArray(value) ? value : [value]
      }
      catch {
        fixtures = ['commonjs']
      }

      for (const example of fixtures) {
        console.log(`\n\n${chalk.blue('E2E')} ${chalk.magenta(action)} ${chalk.blue('› fixture')} ${chalk.magenta(example)} ${chalk.blue('...')}`)
        await ensureFixture(example)
        const fixtureTargetPath = join(fixtureTempPath, example)

        await runTests({
          extensionDevelopmentPath,
          extensionTestsPath,
          version: '1.89.0',
          launchArgs: [fixtureTargetPath, '--disable-extensions'],
          extensionTestsEnv: {
            E2E_ACTION: action,
            E2E_FIXTURE: example,
          },
        })

        console.log(chalk.green(`E2E ${action} › ${example} finished.\n`))
      }
    }
    process.exit(0)
  }
  catch {
    logger.error('Failed to run tests')
    process.exit(1)
  }
}

main()
