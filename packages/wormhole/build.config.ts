import fglob from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  declaration: true, // 直接使用typings
  failOnWarn: false,
  hooks: {
    'build:done': async ctx => {
      // fix:stub mode jiti path `file:///`
      // https://github.com/unjs/unbuild/issues/248
      if (ctx.options.stub) {
        fglob.sync('./dist/**/*.*js', { onlyFiles: true }).forEach(fileUrl => {
          const filePath = path.resolve(__dirname, fileUrl);
          fs.readFile(filePath, (err, data) => {
            if (err) {
              return err;
            }
            const str = data
              .toString()
              .replace(/file:\/\/\/(.+)/g, subStr =>
                path.relative(path.resolve(filePath, '..'), url.fileURLToPath(subStr)).replace(/\\/g, '/')
              );
            fs.writeFile(filePath, str, err => {
              if (err) {
                return err;
              }
            });
          });
        });
      }
      // copy all things under src/templates to dist/templates
      // https://github.com/unjs/unbuild/issues/266
      const { copy } = await import('fs-extra');
      await copy('src/templates', 'dist/templates');
    }
  },
  alias: {
    '@': path.resolve(__dirname, './src'),
    '~': path.resolve(__dirname, './typings'),
    '#': path.join(__dirname)
  },
  externals: ['typescript'],
  rollup: {
    alias: {
      entries: {}
    },
    dts: {
      respectExternal: false
    },
    emitCJS: true
  }
});
