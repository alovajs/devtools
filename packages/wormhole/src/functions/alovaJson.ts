import type { CacheData } from '@/type'
import type { GeneratorConfig, TemplateData } from '@/type/lib'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getGlobalConfig } from '@/config'
import { logger } from '@/helper'
import { existsPromise, format } from '@/utils'

const DEFAULT_CONFIG = getGlobalConfig()

/**
 * Convert TemplateData to standardized CacheData
 */
export function toCacheData(templateData: TemplateData, config?: GeneratorConfig): CacheData {
  return {
    serverName: config?.serverName || '',
    apis: templateData.tagedApis || [],
  }
}

export async function writeAlovaJson(
  data: TemplateData,
  originPath: string,
  name = 'api.json',
  config?: GeneratorConfig,
) {
  const cacheData = toCacheData(data, config)
  const jsonData = await format(JSON.stringify(cacheData, null, 2), { parser: 'json' })
  const filePath = `${originPath}_${name}`
  const dirPath = filePath.split(/\/|\\/).slice(0, -1).join('/')
  if (!(await existsPromise(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true })
  }
  return fs.writeFile(filePath, jsonData)
}

export async function readAlovaJson(originPath: string, name = 'api.json'): Promise<CacheData> {
  const filePath = `${originPath}_${name}`
  if (!(await existsPromise(filePath))) {
    throw logger.throwError('alovaJson is not exists')
  }
  const data = await fs.readFile(filePath, 'utf8')
  try {
    return JSON.parse(data)
  }
  catch {
    return { serverName: '', apis: [] }
  }
}

export function getAlovaJsonPath(workspaceRootDir: string, outputPath: string) {
  return path.join(
    workspaceRootDir,
    DEFAULT_CONFIG.alovaTempPath,
    outputPath.split(/\/|\\/).join('_'),
  )
}
