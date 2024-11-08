#!/usr/bin/env node
/* c8 ignore start */
import { Command } from 'commander';
import { actionGen, actionInit } from './actions';

const pkg = require('../../package.json');

const program = new Command();
program.name('alova').description('CLI to generate api for alova.js').version(pkg.version);
program
  .command('init')
  .description('init a configuration file')
  .option('-t, --type [type]', 'type of configuration')
  .option('-p, --path [path]', 'init configuration path')
  .action(actionInit);

program
  .command('gen')
  .option('-f, --force', 'force generate api')
  .option('-p, --path [path]', 'generating path')
  .option('-w, --workspace', 'generating path')
  .description('generate api for alova.js')
  .action(actionGen);

program.parse(process.argv);
/* c8 ignore stop */
