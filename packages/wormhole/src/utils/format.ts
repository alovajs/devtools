import { Config as PrettierConfig } from 'prettier';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEsTree from 'prettier/plugins/estree';
import * as prettierTs from 'prettier/plugins/typescript';
import * as prettier from 'prettier/standalone';

export const prettierConfig: PrettierConfig = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  insertPragma: false,
  endOfLine: 'auto',
  bracketSameLine: true,
  arrowParens: 'avoid',
  vueIndentScriptAndStyle: false,
  singleAttributePerLine: true
};

export async function format(text: string, config?: PrettierConfig) {
  return prettier.format(text, {
    ...(prettierConfig as PrettierConfig),
    parser: 'typescript', // Specify to use babel parser

    ...(config ?? {}),
    plugins: [prettierTs, prettierEsTree, prettierBabel]
  });
}
