import esbuild, { Plugin } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import path from 'node:path';
import { copy } from 'esbuild-plugin-copy';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin: Plugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location?.file ?? ''}:${location?.line ?? ''}:${location?.column ?? ''}:`);
      });
      console.log('[watch] build finished');
    });
  }
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts', 'src/work.ts'],
    loader: {
      '.handlebars': 'text'
    },
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outdir: 'out',
    external: ['vscode', 'esbuild'],
    logLevel: 'silent',
    plugins: [
      alias({
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './typings'),
        '#': path.resolve(__dirname, '.')
      }) as Plugin,
      copy({
        // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
        // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
        assets: [
          {
            from: ['./node_modules/esbuild/**/*'],
            to: ['node_modules/esbuild']
          },
          {
            from: ['./node_modules/@esbuild/**/*'],
            to: ['node_modules/@esbuild/']
          }
        ],
        watch: true
      }),
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin
    ]
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
