#!/usr/bin/env node
const { program } = require('commander');
const package = require('../package.json');
const { createConfig, readConfig, generate } = require('../dist/index.cjs');

program.name('@alova/wormhole').description('CLI to generate api for alova.js').version(package.version);

program
  .command('init')
  .description('init alova.config')
  .action(() => {
    createConfig()
      .then(() => {
        console.log('alova.config生成成功！');
      })
      .catch(error => {
        console.log(error);
      });
  });

program
  .command('gen')
  .option('-f', 'force generate api')
  .description('generate api for alova.js')
  .action(option => {
    readConfig()
      .then(config => generate(config, { force: option.f }))
      .then(([result]) => {
        if (result) {
          console.log('api文件生成成功！');
        } else {
          console.log('api文件生成失败！,尝试强制生成【alova gen -f】');
        }
      })
      .catch(error => {
        console.log(error);
      });
  });

program.parse(process.argv); // 表示使用 Commander 来处理命令行参数
