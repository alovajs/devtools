/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import chalk from 'chalk'
import Pino from 'pino'
import { projectRoot } from './path'

interface RunOptons {
  cwd?: string
  noError?: boolean
}
export const logger = Pino()
export async function run(command: string, options?: RunOptons) {
  const { cwd = projectRoot, noError = false } = options ?? {}
  return new Promise<void>((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')
    console.log(`run: ${chalk.green(`${cmd} ${args.join(' ')}`)}`)
    const app = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    const onProcessExit = () => app.kill('SIGHUP')
    app.on('close', (code) => {
      process.removeListener('exit', onProcessExit)

      if (code === 0 || noError) {
        resolve()
      }
      else {
        reject(new Error(`Command failed. \n Command: ${command} \n Code: ${code}`))
      }
    })
    process.on('exit', onProcessExit)
  })
}
