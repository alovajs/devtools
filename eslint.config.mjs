import antfu from '@antfu/eslint-config';

export default antfu({
  ignores: [
    '**/out',
    '**/dist',
    '**/__mocks__',
    '**/*.handlebars',
    '**/.vscode-test',
    '**/.vscode-test.mjs',
    '*.{js,mjs,cjs}',
    'packages/wormhole/typings',
    'design',
    'test/**/*'
  ],
  markdown: false,
  formatters: true
}).removeRules('node/prefer-global/process');
