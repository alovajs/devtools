import type { Config } from '@/type'
import fs from 'node:fs/promises'
import { Module } from 'node:module'
import { dirname, resolve } from 'node:path'
import { vol } from 'memfs'
import { createConfig, readConfig } from '@/index'
import { clearPackageJsonCache } from '@/utils/readPackageJson'

vi.mock('node:fs')
vi.mock('node:fs/promises')

// Map to mock require() results for package.json resolution
const requireResult = new Map<string, any>()

// Patch Module._resolveFilename so paths we pre-populate in Module._cache
// resolve without filesystem access. Falls back to the original resolver.
const originalResolveFilename = (Module as any)._resolveFilename
  ; (Module as any)._resolveFilename = function patchedResolveFilename(request: string, ...rest: any[]) {
  if ((Module as any)._cache && (Module as any)._cache[request]) {
    return request
  }
  return originalResolveFilename.call(this, request, ...rest)
}

// Mock esbuild so build() operates entirely in-memory:
// - reads entry source from the memfs-mocked fs
// - transforms with the real esbuild's transform()
// - pre-loads Node's require cache for the temp outfile so `require(outfile)`
//   in src/readConfig.ts doesn't touch the real disk
// - writes the bundle into memfs so any later unlink/cleanup operates on memfs
vi.mock('esbuild', async () => {
  const real = await vi.importActual<typeof import('esbuild')>('esbuild')
  const customBuild = async (options: any) => {
    const entryPoint: string = options.entryPoints[0]
    const outfile: string = options.outfile
    const projectDir = dirname(entryPoint)
    const source = await fs.readFile(entryPoint, 'utf-8')
    const ext = entryPoint.split('.').pop() ?? 'ts'
    const loader = ext === 'ts' || ext === 'tsx' || ext === 'mts' || ext === 'cts'
      ? 'ts'
      : 'js'
    const transformed = await real.transform(source, {
      loader: loader as any,
      format: 'cjs',
      platform: 'node',
    })

    // Custom require for in-memory evaluation:
    //  - check requireResult Map first (set by tests)
    //  - relative paths -> read from memfs (JSON parsed for .json)
    //  - bare specifiers -> empty object (configs only use type imports for these)
    const customRequire = (spec: string) => {
      if (spec.startsWith('.') || spec.startsWith('/') || /^[a-z]:/i.test(spec)) {
        const target = resolve(projectDir, spec)
        // Check requireResult map first (used to mock specific module results)
        if (requireResult.has(target)) {
          const cached = requireResult.get(target)
          if (cached === null)
            throw new Error(`Cannot find module '${spec}'`)
          return cached
        }
        // try direct, then with .json extension
        for (const candidate of [target, `${target}.json`]) {
          try {
            const data = vol.readFileSync(candidate, 'utf-8') as string
            if (candidate.endsWith('.json'))
              return JSON.parse(data)
            return data
          }
          catch { }
        }
        throw new Error(`Cannot find module '${spec}'`)
      }
      return {}
    }

    const moduleExports: Record<string, any> = {}
    const moduleObj = { exports: moduleExports }
    // eslint-disable-next-line no-new-func
    const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', transformed.code)
    fn(moduleObj, moduleObj.exports, customRequire, entryPoint, projectDir)

    // Persist a stub bundle into memfs so any later unlink works against memfs.
    await fs.mkdir(dirname(outfile), { recursive: true }).catch(() => { })
    await fs.writeFile(outfile, transformed.code, 'utf-8')

    // Pre-populate Node require cache so `require(outfile)` returns the captured
    // exports without ever touching the real filesystem.
    const cached = new Module(outfile)
    cached.filename = outfile
    cached.loaded = true
    cached.exports = moduleObj.exports
    ; (Module as any)._cache[outfile] = cached
    return { errors: [], warnings: [], outputFiles: [] } as any
  }
  return {
    ...real,
    build: customBuild,
    default: { ...real, build: customBuild },
  }
})

beforeEach(() => {
  vol.reset()
  clearPackageJsonCache()
  // Ensure process.cwd() exists in memfs so fs.writeFile can create files there
  vol.mkdirSync(process.cwd(), { recursive: true })
})

// 比较配置，plugins 函数单独断言
function expectConfigEqual(actual: Config, expected: Config) {
  expect(actual.generator.length).toBe(expected.generator.length)
  actual.generator.forEach((gen, idx) => {
    const expectedGen = expected.generator[idx]
    const { plugins: actualPlugins, ...actualRest } = gen
    const { plugins: expectedPlugins, ...expectedRest } = expectedGen
    expect(actualRest).toEqual(expectedRest)
    expect(Array.isArray(actualPlugins)).toBe(true)
    expect(Array.isArray(expectedPlugins)).toBe(true)
    expect(actualPlugins?.length).toBe(expectedPlugins?.length)
  })
}

const configMap: Record<string, { file: string, content: string, expectedConfig: Config, transformContent?: string }>
  = {
    ts: {
      file: 'worma.config.ts',
      content: `import type { Config } from 'wormajs';
import pkg from './package.json';
export default <Config>{
  generator: [
    {
      input: 'http://localhost:3000/' + pkg.name,
      output: 'src/api',
      type: 'ts',
      plugins: [{getTemplate: () => ({path: ''})}]
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/alova-devtools',
            output: 'src/api',
            type: 'ts',
            bodyMediaType: 'application/json',
            responseMediaType: 'application/json',
            defaultRequire: false,
            plugins: [{ getTemplate() { return { path: '' } } }],
          },
        ],
      },
    },
    tsWithoutImport: {
      file: 'worma.config.ts',
      content: `import type { Config } from 'wormajs';
export default <Config>{
  generator: [
    {
      input: 'http://localhost:3000/',
      output: 'src/api',
      type: 'ts',
      plugins: [{getTemplate: () => ({path: ''})}]
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/',
            output: 'src/api',
            type: 'ts',
            bodyMediaType: 'application/json',
            responseMediaType: 'application/json',
            defaultRequire: false,
            plugins: [{ getTemplate() { return { path: '' } } }],
          },
        ],
      },
    },
    module: {
      file: 'worma.config.js',
      content: `import pkg from './package.json';
export default {
  generator: [
    {
      input: 'http://localhost:3000/' + pkg.name,
      output: 'src/api',
      type: 'module',
      plugins: [{getTemplate: () => ({path: ''})}]
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/alova-devtools',
            output: 'src/api',
            type: 'module',
            bodyMediaType: 'application/json',
            responseMediaType: 'application/json',
            defaultRequire: false,
            plugins: [{ getTemplate() { return { path: '' } } }],
          },
        ],
      },
    },
    commonjs: {
      file: 'worma.config.js',
      content: `const pkg = require('./package.json');
module.exports = {
  generator: [
    {
      input: 'http://localhost:3000/' + pkg.name,
      output: 'src/api',
      type: 'commonjs',
      plugins: [{getTemplate: () => ({path: ''})}]
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/alova-devtools',
            output: 'src/api',
            type: 'commonjs',
            bodyMediaType: 'application/json',
            responseMediaType: 'application/json',
            defaultRequire: false,
            plugins: [{ getTemplate() { return { path: '' } } }],
          },
        ],
      },
    },
  }

describe('config', () => {
  it('should create config file under project root path', async () => {
    // generate typescript file
    await fs.writeFile(resolve(process.cwd(), './package.json'), JSON.stringify({
      devDependencies: {
        typescript: '^5.4.5',
      },
      dependencies: {
        alova: '3.0.5',
      },
    }), 'utf-8')
    requireResult.set(resolve(process.cwd(), './package.json'), {
      devDependencies: {
        typescript: '^5.4.5',
      },
      dependencies: {
        alova: '3.0.5',
      },
    })
    clearPackageJsonCache()
    await createConfig()
    const tsConfigPath = resolve(process.cwd(), 'worma.config.ts')
    const initialTsConfig = await fs.readFile(tsConfigPath, {
      encoding: 'utf-8',
    })
    expect(initialTsConfig).toMatch(`import { defineConfig } from 'wormajs';`)
    expect(initialTsConfig).toMatch(`import { swagger, aiDoc, alova } from 'wormajs/plugin';`)
    expect(initialTsConfig).toMatch(`export default defineConfig({`)
    expect(initialTsConfig).toMatch(`[swagger('http://localhost:3000'), aiDoc({ installSkill: true }), alova()]`)

    // generate commonjs file
    await fs.writeFile(resolve(process.cwd(), './package.json'), JSON.stringify({
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5',
      },
    }), 'utf-8')
    requireResult.set(resolve(process.cwd(), './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5',
      },
    })
    clearPackageJsonCache()
    await createConfig()
    const initialCjsConfig = await fs.readFile(resolve(process.cwd(), 'worma.config.js'), {
      encoding: 'utf-8',
    })
    expect(initialCjsConfig).toMatch(`const { defineConfig } = require('wormajs');`)
    expect(initialCjsConfig).toMatch(`const { swagger, aiDoc, alova } = require('wormajs/plugin');`)
    expect(initialCjsConfig).toMatch(`module.exports = defineConfig({`)
    expect(initialCjsConfig).toMatch(`plugins: [swagger('http://localhost:3000'), aiDoc({ installSkill: true }), alova()]`)

    // generate module file
    await fs.writeFile(resolve(process.cwd(), './package.json'), JSON.stringify({
      dependencies: {
        alova: '3.0.5',
      },
    }), 'utf-8')
    requireResult.set(resolve(process.cwd(), './package.json'), {
      dependencies: {
        alova: '3.0.5',
      },
    })
    clearPackageJsonCache()
    await createConfig()
    const initialEsmoduleConfig = await fs.readFile(resolve(process.cwd(), 'worma.config.js'), {
      encoding: 'utf-8',
    })
    expect(initialEsmoduleConfig).toMatch(`import { defineConfig } from 'wormajs';`)
    expect(initialEsmoduleConfig).toMatch(`import { swagger, aiDoc, alova } from 'wormajs/plugin';`)
    expect(initialEsmoduleConfig).toMatch(`export default defineConfig({`)
    expect(initialEsmoduleConfig).toMatch(`plugins: [swagger('http://localhost:3000'), aiDoc({ installSkill: true }), alova()]`)

    // generate file with target type
    await createConfig({ type: 'typescript' })
    const initialTypedConfig = await fs.readFile(resolve(process.cwd(), 'worma.config.ts'), {
      encoding: 'utf-8',
    })
    expect(initialTypedConfig).toMatch(`import { defineConfig } from 'wormajs';`)
    expect(initialTypedConfig).toMatch(`import { swagger, aiDoc, alova } from 'wormajs/plugin';`)
    expect(initialTypedConfig).toMatch(`export default defineConfig({`)
    expect(initialTypedConfig).toMatch(`plugins: [swagger('http://localhost:3000'), aiDoc({ installSkill: true }), alova()]`)
  })

  it('should create config file with specified template preset', async () => {
    await fs.writeFile(resolve(process.cwd(), './package.json'), JSON.stringify({
      devDependencies: {
        typescript: '^5.4.5',
      },
    }), 'utf-8')
    requireResult.set(resolve(process.cwd(), './package.json'), {
      devDependencies: {
        typescript: '^5.4.5',
      },
    })
    await createConfig({ template: 'axios' })
    const axiosConfig = await fs.readFile(resolve(process.cwd(), 'worma.config.ts'), {
      encoding: 'utf-8',
    })
    expect(axiosConfig).toMatch(`import { swagger, aiDoc, axios } from 'wormajs/plugin';`)
    expect(axiosConfig).toMatch(`plugins: [swagger('http://localhost:3000'), aiDoc({ installSkill: true }), axios()]`)

    await createConfig({ template: 'fetch' })
    const fetchConfig = await fs.readFile(resolve(process.cwd(), 'worma.config.ts'), {
      encoding: 'utf-8',
    })
    expect(fetchConfig).toMatch(`import { swagger, aiDoc, fetch } from 'wormajs/plugin';`)
    expect(fetchConfig).toMatch(`plugins: [swagger('http://localhost:3000'), aiDoc({ installSkill: true }), fetch()]`)
  })

  it('should create config file under a custom absolute path', async () => {
    const customPath = './mockdir_config_0'
    await fs.mkdir(resolve(customPath), { recursive: true })
    await fs.writeFile(resolve(customPath, './package.json'), JSON.stringify({
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5',
      },
    }), 'utf-8')
    requireResult.set(resolve(customPath, './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5',
      },
    })
    await createConfig({ projectPath: customPath })
    const configPath = resolve(customPath, 'worma.config.js')
    const initialConfig = await fs.readFile(configPath, {
      encoding: 'utf-8',
    })
    expect(!!initialConfig).toBeTruthy()
  })

  it('should create config file under a custom relative path', async () => {
    const customPath = './mockdir_config'
    const pkgPath = resolve(process.cwd(), customPath, './package.json')
    await fs.mkdir(resolve(process.cwd(), customPath), { recursive: true })
    await fs.writeFile(pkgPath, JSON.stringify({
      type: 'commonjs',
      dependencies: {
        alova: '3.0.8',
      },
    }), 'utf-8')
    requireResult.set(pkgPath, {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.8',
      },
    })
    await createConfig({ projectPath: customPath })
    const configPath = resolve(process.cwd(), customPath, 'worma.config.js')
    const initialConfig = await fs.readFile(configPath, {
      encoding: 'utf-8',
    })
    expect(!!initialConfig).toBeTruthy()
  })

  it('should read config file under project root path', async () => {
    const projectRoot = resolve(__dirname, './mockdir_config_root')
    await fs.mkdir(projectRoot, { recursive: true })

    const mockPackageJson = {
      name: 'alova-devtools',
      version: '1.0.0',
    }
    await fs.writeFile(resolve(projectRoot, 'package.json'), JSON.stringify(mockPackageJson, null, 2), 'utf-8')

    // read ts file
    await fs.writeFile(resolve(projectRoot, configMap.ts.file), configMap.ts.content, 'utf-8')
    requireResult.set(resolve(projectRoot, './package.json'), mockPackageJson)

    const tsConfig = await readConfig(projectRoot)
    expectConfigEqual(tsConfig, configMap.ts.expectedConfig)

    // read module config file
    await fs.writeFile(resolve(projectRoot, configMap.module.file), configMap.module.content, 'utf-8')
    requireResult.set(resolve(projectRoot, './package.json'), mockPackageJson)

    const moduleConfig = await readConfig(projectRoot)
    expectConfigEqual(moduleConfig, configMap.module.expectedConfig)

    // read commonjs config file
    await fs.writeFile(resolve(projectRoot, configMap.commonjs.file), configMap.commonjs.content, 'utf-8')
    requireResult.set(resolve(projectRoot, './package.json'), mockPackageJson)

    const cjsConfig = await readConfig(projectRoot)
    expectConfigEqual(cjsConfig, configMap.commonjs.expectedConfig)
  })

  it('should read config file under target path', async () => {
    const customPath = resolve(__dirname, './mockdir_config2')
    await fs.mkdir(customPath, { recursive: true })
    await fs.writeFile(resolve(customPath, configMap.tsWithoutImport.file), configMap.tsWithoutImport.content, 'utf-8')
    requireResult.set(customPath, null) // require()=> throw error

    const tsConfig = await readConfig(customPath)
    expectConfigEqual(tsConfig, configMap.tsWithoutImport.expectedConfig)
  })

  // readConfig 的相对路径 / try-finally 清理回归测试见 test/readConfig.spec.ts
  // （需真实文件系统 + 真实 esbuild，memfs 的 esbuild mock 会预填充 Module._cache
  //  绕过 require 的路径解析，无法捕获相关回归）
})
