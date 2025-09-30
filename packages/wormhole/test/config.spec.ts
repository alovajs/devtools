import type { Config } from '@/type'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { rimraf } from 'rimraf'
import { createConfig, readConfig } from '@/index'
import { existsPromise } from '@/utils'

const requireResult = new Map<string, Record<string, any> | null | Error>()
vi.mock('import-fresh', () => ({
  __esModule: true,
  default(path: string) {
    if (!requireResult.get(path)) {
      throw new Error(`require ${path} not found`)
    }
    const result = requireResult.get(path)
    if (result instanceof Error) {
      throw result
    }
    return result
  },
}))

const configMap: Record<string, { file: string, content: string, expectedConfig: Config, transformContent?: string }>
  = {
    ts: {
      file: 'alova.config.ts',
      content: `import type { Config } from '@alova/wormhole';
import pkg from './package.json';
export default <Config>{
  generator: [
    {
      input: 'http://localhost:3000/' + pkg.name,
      output: 'src/api',
      type: 'ts',
      version: 3
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/alova-devtools',
            output: 'src/api',
            type: 'ts',
            version: 3,
          },
        ],
      },
    },
    tsWithoutImport: {
      file: 'alova.config.ts',
      content: `import type { Config } from '@alova/wormhole';
export default <Config>{
  generator: [
    {
      input: 'http://localhost:3000/',
      output: 'src/api',
      type: 'ts',
      version: 3
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/',
            output: 'src/api',
            type: 'ts',
            version: 3,
          },
        ],
      },
    },
    module: {
      file: 'alova.config.js',
      content: `import pkg from './package.json';
export default {
  generator: [
    {
      input: 'http://localhost:3000/' + pkg.name,
      output: 'src/api',
      type: 'module',
      version: 3
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/alova-devtools',
            output: 'src/api',
            type: 'module',
            version: 3,
          },
        ],
      },
    },
    commonjs: {
      file: 'alova.config.js',
      content: `const pkg = require('./package.json');
module.exports = {
  generator: [
    {
      input: 'http://localhost:3000/' + pkg.name,
      output: 'src/api',
      type: 'commonjs',
      version: 3
    }
  ]
}`,
      expectedConfig: {
        generator: [
          {
            input: 'http://localhost:3000/alova-devtools',
            output: 'src/api',
            type: 'commonjs',
            version: 3,
          },
        ],
      },
    },
  }

afterEach(async () => {
  await Promise.all([
    rimraf(resolve(process.cwd(), 'alova.config.ts')),
    rimraf(resolve(process.cwd(), 'alova.config.js')),
    rimraf(resolve(process.cwd(), 'node_modules/.alova')),
  ]).catch(() => {})
})

describe('config', () => {
  it('should create config file under project root path', async () => {
    // generate typescript file

    requireResult.set(resolve(process.cwd(), './package.json'), {
      devDependencies: {
        typescript: '^5.4.5',
      },
      dependencies: {
        alova: '3.0.5',
      },
    })
    await createConfig()
    const tsConfigPath = resolve(process.cwd(), 'alova.config.ts')
    const initialTsConfig = await fs.readFile(tsConfigPath, {
      encoding: 'utf-8',
    })
    expect(initialTsConfig).toMatch(`import { defineConfig } from '@alova/wormhole';`)
    expect(initialTsConfig).toMatch(`export default defineConfig({`)
    expect(initialTsConfig).toMatch(`input: 'http://localhost:3000',`)
    // generate commonjs file

    requireResult.set(resolve(process.cwd(), './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5',
      },
    })
    await createConfig()
    const initialCjsConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.js'), {
      encoding: 'utf-8',
    })
    expect(initialCjsConfig).toMatch(`const { defineConfig } = require('@alova/wormhole');`)
    expect(initialCjsConfig).toMatch(`module.exports = defineConfig({`)

    // generate module file

    requireResult.set(resolve(process.cwd(), './package.json'), {
      dependencies: {
        alova: '3.0.5',
      },
    })
    await createConfig()
    const initialEsmoduleConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.js'), {
      encoding: 'utf-8',
    })
    expect(initialEsmoduleConfig).toMatch(`import { defineConfig } from '@alova/wormhole';`)
    expect(initialEsmoduleConfig).toMatch(`export default defineConfig({`)

    // generate file with target type

    await createConfig({ type: 'typescript' })
    const initialTypedConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.ts'), {
      encoding: 'utf-8',
    })
    expect(initialTypedConfig).toMatch(`import { defineConfig } from '@alova/wormhole';`)
    expect(initialTypedConfig).toMatch(`export default defineConfig({`)
    expect(initialTypedConfig).toMatch(`input: 'http://localhost:3000',`)
  })

  it('should create config file under a custom absolute path', async () => {
    const customPath = './mockdir_config_0'
    // Set up package.json file

    requireResult.set(resolve(customPath, './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5',
      },
    })
    try {
      await createConfig({ projectPath: customPath })
      const configPath = resolve(customPath, 'alova.config.js')
      const initialConfig = await fs.readFile(configPath, {
        encoding: 'utf-8',
      })
      expect(!!initialConfig).toBeTruthy()
    }
    finally {
      await rimraf(resolve(customPath)) // clear temporary directory
    }
  })

  it('should create config file under a custom relative path', async () => {
    const customPath = './mockdir_config'
    // Set up package.json file

    requireResult.set(resolve(process.cwd(), customPath, './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.8',
      },
    })
    try {
      await createConfig({ projectPath: customPath })
      const configPath = resolve(process.cwd(), customPath, 'alova.config.js')
      const initialConfig = await fs.readFile(configPath, {
        encoding: 'utf-8',
      })
      expect(!!initialConfig).toBeTruthy()
    }
    finally {
      await rimraf(resolve(process.cwd(), customPath)) // clear temporary directory
    }
  })

  it('should read config file under project root path', async () => {
    // write mock config file
    const projectRoot = resolve(__dirname, './mockdir_config_root')
    if (!(await existsPromise(projectRoot))) {
      await fs.mkdir(projectRoot, { recursive: true })
    }

    // Create mock package.json file
    const mockPackageJson = {
      name: 'alova-devtools',
      version: '1.0.0',
    }
    await fs.writeFile(resolve(projectRoot, 'package.json'), JSON.stringify(mockPackageJson, null, 2), 'utf-8')

    try {
      // read ts file
      await fs.writeFile(resolve(projectRoot, configMap.ts.file), configMap.ts.content, 'utf-8')
      requireResult.set(resolve(projectRoot, './package.json'), mockPackageJson)

      const tsConfig = await readConfig(projectRoot)
      expect(tsConfig).toStrictEqual(configMap.ts.expectedConfig)

      // read module config file
      await fs.writeFile(resolve(projectRoot, configMap.module.file), configMap.module.content, 'utf-8')
      requireResult.set(resolve(projectRoot, './package.json'), mockPackageJson)

      const moduleConfig = await readConfig(projectRoot)
      expect(moduleConfig).toEqual(configMap.module.expectedConfig)

      // read commonjs config file
      await fs.writeFile(resolve(projectRoot, configMap.commonjs.file), configMap.commonjs.content, 'utf-8')
      requireResult.set(resolve(projectRoot, './package.json'), mockPackageJson)

      const cjsConfig = await readConfig(projectRoot)
      expect(cjsConfig).toStrictEqual(configMap.commonjs.expectedConfig)
    }
    finally {
      // Clean up temporary directory
      await rimraf(projectRoot)
    }
  })

  it('should read config file under target path', async () => {
    // read ts file

    const customPath = resolve(__dirname, './mockdir_config2')
    if (!(await existsPromise(customPath))) {
      await fs.mkdir(customPath, { recursive: true })
    }
    await fs.writeFile(resolve(customPath, configMap.tsWithoutImport.file), configMap.tsWithoutImport.content, 'utf-8')
    requireResult.set(customPath, null) // require()=> throw error

    try {
      const tsConfig = await readConfig(customPath)
      expect(tsConfig).toStrictEqual(configMap.tsWithoutImport.expectedConfig)
    }
    finally {
      await rimraf(customPath) // clear temporary directory
    }
  })
})
