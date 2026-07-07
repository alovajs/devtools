#!/usr/bin/env node
/* c8 ignore start */
import { Command, Option } from 'commander'

import { ConfigTypeEnum, PresetTemplateName, TemplateTypeEnum } from '@/constant'
import { actionGen, actionInit } from './actions'

// eslint-disable-next-line ts/no-require-imports, perfectionist/sort-imports
const pkg = require('../../package.json')

const program = new Command()
program.name('worma').description('CLI to generate API from OpenAPI specs').version(pkg.version)
program
  .command('init')
  .description('init a configuration file')
  .addOption(new Option('-t, --type <type>', 'type of configuration').choices([TemplateTypeEnum.TYPESCRIPT, ConfigTypeEnum.TS, TemplateTypeEnum.COMMONJS, TemplateTypeEnum.MODULE]))
  .addOption(new Option('-T, --template <template>', 'template preset to use').choices([PresetTemplateName.ALOVA, PresetTemplateName.AXIOS, PresetTemplateName.FETCH, PresetTemplateName.KY]))
  .option('-p, --project <path>', 'project directory')
  .action(actionInit)

program
  .command('gen')
  .description('generate API from OpenAPI specs')
  .option('-f, --force', 'force generate api')
  .option('-d, --debug', 'enable debug logging')
  .option('-p, --project <path>', 'project directory (single project mode)')
  .action(actionGen)

program.parse(process.argv)
/* c8 ignore stop */
