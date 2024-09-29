module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  ignorePatterns: ['out', '**/__mocks__', '**/*.handlebars', 'test/api-*/**/*.*'],
  extends: ['airbnb', 'airbnb-typescript', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json', // 确保路径正确
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',

    // eslint-airbnb
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-param-reassign': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'import/no-mutable-exports': 'off',
    'no-nested-ternary': 'off',
    'no-multi-assign': 'off',
    'consistent-return': 'off',
    'no-restricted-exports': 'off',
    'linebreak-style': 'off',
    'no-unused-vars': 'off',
    'import/order': 'off',
    'import/no-relative-packages': 'off',
    'guard-for-in': 'off',
    'max-classes-per-file': 'off',
    'no-await-in-loop': 'off',
    'func-names': 'off',
    'no-continue': 'off',
    // @typescript-eslint
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { destructuredArrayIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'no-empty': 'off'
  }
};
