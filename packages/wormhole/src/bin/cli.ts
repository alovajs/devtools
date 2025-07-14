#!/usr/bin/env node
/* c8 ignore start */
import { Command } from 'commander'

import pkg from '../../package.json'
import { actionGen, actionInit } from './actions'

const program = new Command()
program.name('alova').description('CLI to generate api for alova.js').version(pkg.version)
program
  .command('init')
  .description('init a configuration file')
  .option('-t, --type <type>', 'type of configuration, options are `typescript`, `ts`, `commonjs`, `module`')
  .option('-c, --cwd <path>', 'current working directory')
  .action(actionInit)

program
  .command('gen')
  .option('-f, --force', 'force generate api')
  .option('-c, --cwd <path>', 'current working directory')
  .option('-w, --workspace', 'run as workspace')
  .description('generate api for alova.js')
  .action(actionGen)

program.parse(process.argv)
/* c8 ignore stop */
