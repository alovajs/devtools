import type { ApiPlugin, GeneratorConfig } from '@/type'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import isEqualWith from 'lodash/isEqualWith'
import { expect } from 'vitest'
import { generate } from '@/index'

// Customize the comparator function and ignore the comparison of the function
function customizer(objValue: any, othValue: any) {
  if (typeof objValue === 'function' && typeof othValue === 'function') {
    return objValue.toString() === othValue.toString() // Compare function content
  }
}
export const isEqualObject = (objValue: any, othValue: any) => isEqualWith(objValue, othValue, customizer)
export function initExpect() {
  expect.extend({
    toBeDeepEqual(received, expected) {
      const pass = isEqualObject(received, expected)
      if (pass) {
        return {
          message: () => `expected ${received} not to be deep equal ${expected}`,
          pass: true,
        }
      }
      return {
        message: () => `expected ${received} to be deep equal ${expected}`,
        pass: false,
      }
    },
  })
}
export function createStrReg(str: string) {
  str = str.replace(/([[\](){}.*+|\\/^$?])/g, '\\$1').replace(/\s+/g, '\\s+')
  return new RegExp(str)
}

export const getSalt = () => `_${Math.random().toString(36).slice(2)}`

export async function generateWithPlugin(inputFile: string, plugins: ApiPlugin[], config?: Partial<Omit<GeneratorConfig, 'input' | 'plugins' | 'type'>>) {
  const outputDir = config?.output ?? resolve(__dirname, `./mock_output/plugin_test${getSalt()}`)
  await generate({
    generator: [{ ...config, input: inputFile, output: outputDir, plugins, type: 'ts' }],
  })
  const apiDefinitionsFile = await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')
  const globalsFile = await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')

  return { apiDefinitionsFile, globalsFile }
}
