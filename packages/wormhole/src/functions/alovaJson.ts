import type { TemplateData } from '@/type'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getGlobalConfig } from '@/config'
import { logger } from '@/helper'
import { existsPromise, format } from '@/utils'

const DEFAULT_CONFIG = getGlobalConfig()
export async function writeAlovaJson(data: TemplateData, originPath: string, name = 'api.json') {
  // Convert data to JSON string

  const jsonData = await format(JSON.stringify(data, null, 2), { parser: 'json' })
  // Define the path and name of the JSON file

  const filePath = `${originPath}_${name}`
  const dirPath = filePath.split(/\/|\\/).slice(0, -1).join('/')
  if (!(await existsPromise(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true })
  }
  // Use fs.writeFile to write JSON data to a file

  return fs.writeFile(filePath, jsonData)
}
export async function readAlovaJson(originPath: string, name = 'api.json') {
  // Define the path and name of the JSON file

  const filePath = `${originPath}_${name}`
  if (!(await existsPromise(filePath))) {
    throw logger.throwError('alovaJson is not exists')
  }

  // Read JSON files using fs.readFile

  const data = await fs.readFile(filePath, 'utf8')
  let jsonData = {} as TemplateData
  try {
    jsonData = JSON.parse(data)
  }
  catch {
    jsonData = DEFAULT_CONFIG.templateData.get(originPath) ?? jsonData
  }
  return jsonData
}
export function getAlovaJsonPath(workspaceRootDir: string, outputPath: string) {
  return path.join(workspaceRootDir, DEFAULT_CONFIG.alovaTempPath, outputPath.split(/\/|\\/).join('_'))
}
