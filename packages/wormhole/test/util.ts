import { generate } from '@/index';
import isEqualWith from 'lodash/isEqualWith';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect } from 'vitest';
import { ApiPlugin } from '~/index';

// Customize the comparator function and ignore the comparison of the function
function customizer(objValue: any, othValue: any) {
  if (typeof objValue === 'function' && typeof othValue === 'function') {
    return objValue.toString() === othValue.toString(); // Compare function content
  }
}
export const isEqualObject = (objValue: any, othValue: any) => isEqualWith(objValue, othValue, customizer);
export const initExpect = () => {
  expect.extend({
    toBeDeepEqual(received, expected) {
      const pass = isEqualObject(received, expected);
      if (pass) {
        return {
          message: () => `expected ${received} not to be deep equal ${expected}`,
          pass: true
        };
      }
      return {
        message: () => `expected ${received} to be deep equal ${expected}`,
        pass: false
      };
    }
  });
};
export const createStrReg = (str: string) => {
  str = str.replace(/([[\](){}.*+|\\/^$?])/g, '\\$1').replace(/\s+/g, '\\s+');
  return new RegExp(str);
};

export const getSalt = () => `_${Math.random().toString(36).slice(2)}`;

export const generateWithPlugin = async (inputFile: string, plugins: ApiPlugin[], outputDir?: string) => {
  outputDir ??= resolve(__dirname, `./mock_output/plugin_test${getSalt()}`);
  await generate({
    generator: [{ input: inputFile, output: outputDir, plugins }]
  });

  const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8');
  const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8');

  return { apiDefinitionsFile, globalsFile };
};
