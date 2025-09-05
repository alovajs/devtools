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

  // Frameworks
  const testFrameworksDir = join(projectRoot, './e2e-out/frameworks')
  const fixtureTempPath = join(root, './e2e-fixtures-temp')
  if (fs.existsSync(fixtureTempPath)) {
    await fs.remove(fixtureTempPath)
  }
  const frameworks = await fg('*', {
    onlyDirectories: true,
    cwd: testFrameworksDir,
  })
  try {
    for (const framework of frameworks) {
      console.log(`\n\n${chalk.blue('Start E2E testing for framework')} ${chalk.magenta(framework)} ${chalk.blue('...\n')}`)
      const extensionTestsPath = join(testFrameworksDir, framework, 'index')
      const fixtureSourcePath = join(root, 'examples', framework)
      const fixtureTargetPath = join(fixtureTempPath, framework)

      await fs.copy(fixtureSourcePath, fixtureTargetPath, {
        filter(src) {
          if (src.includes('node_modules')) {
            return false
          }
          return true
        },
      })

      await run('pnpm i', {
        cwd: fixtureTargetPath,
      })

      await runTests({
        extensionDevelopmentPath,
        extensionTestsPath,
        version: '1.89.0',
        launchArgs: [fixtureTargetPath, '--disable-extensions'],
      })

      console.log(chalk.green(`E2E tests for framework ${framework} finished.\n`))
    }
    process.exit(0)
  }
  catch {
    logger.error('Failed to run tests')
    process.exit(1)
  }
}

main()
