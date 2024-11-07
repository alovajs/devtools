import { FlatCompat } from '@eslint/eslintrc';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

const { dirname } = import.meta;
const compat = new FlatCompat({
  baseDirectory: dirname
});

export default [
  {
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
      'test-demos/**/*'
    ]
  },
  ...compat.extends('airbnb', 'airbnb-typescript', 'prettier'),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'commonjs',

      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: dirname
      }
    },

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
      'no-empty': 'off',

      // @typescript-eslint
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: 'Unused'
        }
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/no-throw-literal': 'off'
    }
  }
];
