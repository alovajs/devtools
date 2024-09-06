import path from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  declaration: true,
  failOnWarn: false,
  hooks: {
    'build:done': async () => {
      // copy all things under src/templates to dist/templates
      // https://github.com/unjs/unbuild/issues/266
      const { copy } = await import('fs-extra');
      await copy('src/templates', 'dist/templates');
    }
  },
  rollup: {
    alias: {
      entries: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './typings'),
        '#': path.join(__dirname)
      }
    },
    dts: {
      respectExternal: false
    },
    emitCJS: true
  }
});
