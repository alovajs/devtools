#!/usr/bin/env node
/* c8 ignore start */
import { Command, Option } from 'commander'

import { ConfigTypeEnum, PresetTemplateName, TemplateTypeEnum } from '@/constant'

// eslint-disable-next-line ts/no-require-imports
const pkg = require('../../package.json')
import { actionGen, actionInit } from './actions'

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
  .option('-p, --project <path>', 'project directory (single project mode)')
  .action(actionGen)

program.parse(process.argv)
/* c8 ignore stop */
