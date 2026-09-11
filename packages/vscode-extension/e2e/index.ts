/* eslint-disable no-console */
import { join } from 'node:path'
import { runTests } from '@vscode/test-electron'
import chalk from 'chalk'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { projectRoot, root } from './path.js'
import { logger, run } from './utils.js'

/**
 * Wipe the previous run's fixture directory.
 *
 * On Windows a fixture's `node_modules` is full of pnpm junctions, and the
 * removal regularly fails with EBUSY/EPERM while the indexer / an antivirus /
 * a lingering process still holds a handle. Retry with a backoff and, if the
 * directory still cannot be removed, keep going: `ensureFixture()` re-copies
 * the fixture sources (overwriting) and reinstalls, so a leftover directory is
 * harmless — it must never abort the whole e2e run.
 */
async function removeFixtures(dir: string) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await fs.remove(dir)
      return
    }
    catch (error: any) {
      const code = error?.code
      const transient = code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY'
      if (!transient || attempt === 5) {
        logger.warn(`Could not remove ${dir}: ${error?.message ?? error}. Continuing with the existing directory.`)
        return
      }
      logger.warn(`Failed to remove ${dir} (${code}), retry ${attempt}/5 ...`)
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
    }
  }
}

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
    await removeFixtures(fixtureTempPath)
  }

  // `E2E_ACTIONS=api-changes,extension-activation` restricts the run to a
  // subset of the actions: iterating on one failing suite then costs seconds
  // instead of a full matrix run. Unset → run every action (CI default).
  const only = (process.env.E2E_ACTIONS ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
  const actions = (await fg('*', {
    onlyDirectories: true,
    cwd: actionsDir,
  })).filter(action => only.length === 0 || only.includes(action))

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

  /**
   * Run one action against one fixture. Kept separate so the caller can record a
   * failure and keep going instead of aborting the whole run.
   */
  async function runAction(action: string, extensionTestsPath: string, example: string) {
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

  // Every failing action is recorded instead of aborting on the first one: a
  // single broken suite must not hide regressions in the suites after it.
  const failures: string[] = []

  try {
    for (const action of actions) {
      const extensionTestsPath = join(actionsDir, action, 'index')

      // Which example(s) does this action require?
      let fixtures: string[] = ['commonjs']
      try {
        const mod = await import(join(actionsDir, action, 'fixtures.js'))
        // Under `module: nodenext` the e2e is compiled to CommonJS, and Node's
        // native ESM `import()` of a CJS module exposes `module.exports` as
        // `default`, which itself carries the real `default` export. Unwrap one
        // level so `export default X` resolves to `X` for both scalar and array
        // fixture declarations.
        let value: unknown = mod.default ?? mod
        if (value && typeof value === 'object' && !Array.isArray(value) && 'default' in value)
          value = (value as { default?: unknown }).default
        fixtures = Array.isArray(value) ? value : [String(value)]
      }
      catch {
        fixtures = ['commonjs']
      }

      for (const example of fixtures) {
        try {
          await runAction(action, extensionTestsPath, example)
        }
        catch (error) {
          failures.push(`${action} › ${example}`)
          const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
          logger.error(`E2E ${action} › ${example} failed\n${detail}`)
        }
      }
    }
  }
  catch (error) {
    // Setup-level failure (glob / copy / ...): record it and let the summary
    // below decide the exit code together with the per-action results.
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
    failures.push(`runner setup: ${detail}`)
  }

  if (failures.length > 0) {
    logger.error(`Failed to run tests: ${failures.join(', ')}`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((error) => {
  logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error))
  logger.error('Failed to run tests')
  process.exit(1)
})
