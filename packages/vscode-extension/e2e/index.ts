/* eslint-disable no-console */
import { join } from 'node:path'
import { runTests } from '@vscode/test-electron'
import chalk from 'chalk'
import fg from 'fast-glob'
import fs from 'fs-extra'

async function main() {
  const root = join(__dirname, '../../..')
  const projectRoot = join(__dirname, '..')
  const extensionDevelopmentPath = projectRoot

  // Frameworks
  const testFrameworksDir = join(projectRoot, './e2e-out/frameworks')
  const frameworks = await fg('*', {
    onlyDirectories: true,
    cwd: testFrameworksDir,
  })
  try {
    for (const framework of frameworks) {
      console.log(`\n\n${chalk.blue('Start E2E testing for framework')} ${chalk.magenta(framework)} ${chalk.blue('...\n')}`)
      const extensionTestsPath = join(testFrameworksDir, framework, 'index')
      const fixtureTargetPath = join(root, 'examples', framework)
      const fixtureTargetTestPath = join(root, 'examples', framework, 'src')

      if (fs.existsSync(fixtureTargetTestPath)) {
        await fs.remove(fixtureTargetTestPath)
      }

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
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
