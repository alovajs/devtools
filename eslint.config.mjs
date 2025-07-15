import antfu from '@antfu/eslint-config';

export default antfu({
  ignores: [
    '**/out',
    '**/dist',
    '**/__mocks__',
    '**/*.handlebars',
    '**/.vscode-test',
    '*.{js,mjs,cjs}',
    '**/e2e-out',
    'packages/wormhole/typings',
    'design',
    'test/**/src/*',
    'test/**/{*openapi*.*,*swagger*.*,alova_tmp*.*}',
  ],
  markdown: false,
  formatters: true
}).removeRules('node/prefer-global/process');
