import createConfig from '@/createConfig';
import { readConfig } from '@/readConfig';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rimraf } from 'rimraf';
import type { Config } from '~/index';
import { initExpect } from './util';

initExpect();

const requireResult = new Map<string, Record<string, any> | null | Error>();
vi.mock('import-fresh', () => ({
  __esModule: true,
  default(path: string) {
    if (!requireResult.get(path)) {
      throw new Error(`require ${path} not found`);
    }
    const result = requireResult.get(path);
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }
}));

const importResult = new Map<string, Record<string, any> | null | Error>();
vi.mock('@/utils', async () => {
  const utils = await vi.importActual<typeof import('@/utils')>('@/utils');
  return {
    ...utils,
    loadEsmModule(path: string) {
      path = (/^file:\/\//.test(path) ? fileURLToPath(path) : path).replace(/\?.*$/, '');
      if (!importResult.get(path)) {
        return Promise.reject(new Error(`import ${path} not found`));
      }
      const result = importResult.get(path);
      if (result instanceof Error) {
        return Promise.reject(result);
      }
      return Promise.resolve({
        default: result
      });
    }
  };
});
const configMap: Record<
  'ts' | 'module' | 'commonjs',
  { file: string; content: string; expectedConfig: Config; transformContent?: string }
> = {
  ts: {
    file: 'alova.config.ts',
    content: `import type { Config } from '@alova/wormhole';
export default <Config>{
generator: [
  {
    input: 'http://localhost:3000',
    output: 'src/api',
    type: 'ts',
    version: 3,
    handleApi: api =>api 
  }
]
}`,
    expectedConfig: {
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'ts',
          version: 3,
          handleApi: api => api
        }
      ]
    },
    transformContent: `export default {
    generator: [
        {
            input: 'http://localhost:3000',
            output: 'src/api',
            type: 'ts',
            version: 3,
            handleApi: api => api
        }
    ]
};`
  },
  module: {
    file: 'alova.config.js',
    content: `export default {
generator: [
  {
    input: 'http://localhost:3000',
    output: 'src/api',
    type: 'module',
    version: 3,
    handleApi: api => api
  }
]        
}`,
    expectedConfig: {
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'module',
          version: 3,
          handleApi: api => api
        }
      ]
    }
  },
  commonjs: {
    file: 'alova.config.js',
    content: `module.exports = {
generator: [
  {
    input: 'http://localhost:3000',
    output: 'src/api',
    type: 'commonjs',
    version: 3,
    handleApi: api => api
  }
]        
}`,
    expectedConfig: {
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'commonjs',
          version: 3,
          handleApi: api => api
        }
      ]
    }
  }
};
vi.mock('node:fs/promises', async () => {
  const fs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  function writeFile(filePath: string, content: string, options: any) {
    const configItem = Object.values(configMap).find(item => item.content === content) ?? configMap.ts;
    const pureFilePath = filePath.replace(/\?.*$/, '');
    const isCjs = pureFilePath.endsWith('.cjs') || (pureFilePath.endsWith('.js') && content.includes('module.exports'));
    const isMjs = pureFilePath.endsWith('.mjs') || (pureFilePath.endsWith('.js') && content.includes('export default'));
    if (isCjs) {
      requireResult.set(filePath, configItem.expectedConfig);
    }
    if (isMjs) {
      importResult.set(filePath, configItem.expectedConfig);
    }
    return fs.writeFile(filePath, content, options);
  }
  return {
    ...fs,
    writeFile,
    default: {
      ...(fs as any).default,
      writeFile
    }
  };
});
afterEach(async () => {
  requireResult.clear();
  importResult.clear();
  await Promise.all([
    rimraf(resolve(process.cwd(), 'alova.config.ts')),
    rimraf(resolve(process.cwd(), 'alova.config.js')),
    rimraf(resolve(process.cwd(), 'node_modules/.alova'))
  ]);
});

describe('config', () => {
  test('should create config file under project root path', async () => {
    // generate typescript file
    requireResult.set(resolve(process.cwd(), './package.json'), {
      devDependencies: {
        typescript: '^5.4.5'
      },
      dependencies: {
        alova: '3.0.5'
      }
    });
    await createConfig();
    const tsConfigPath = resolve(process.cwd(), 'alova.config.ts');
    const initialTsConfig = await fs.readFile(tsConfigPath, {
      encoding: 'utf-8'
    });
    expect(initialTsConfig).toMatch(`import type { Config } from '@alova/wormhole';`);
    expect(initialTsConfig).toMatch(`export default <Config>{`);
    expect(initialTsConfig).toMatch(`input: 'http://localhost:3000',`);
    // generate commonjs file
    requireResult.set(resolve(process.cwd(), './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5'
      }
    });
    await createConfig();
    const initialCjsConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.js'), {
      encoding: 'utf-8'
    });
    expect(initialCjsConfig).toMatch(`@type { import('@alova/wormhole').Config }`);
    expect(initialCjsConfig).toMatch(`module.exports = {`);

    // generate module file
    requireResult.set(resolve(process.cwd(), './package.json'), {
      dependencies: {
        alova: '3.0.5'
      }
    });
    await createConfig();
    const initialEsmoduleConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.js'), {
      encoding: 'utf-8'
    });
    expect(initialEsmoduleConfig).toMatch(`@type { import('@alova/wormhole').Config }`);
    expect(initialEsmoduleConfig).toMatch(`export default {`);
  });

  test('should create config file under custom path', async () => {
    const customPath = '/mockdir_config';
    // 设置package.json 文件
    requireResult.set(resolve(customPath, './package.json'), {
      type: 'commonjs',
      dependencies: {
        alova: '3.0.5'
      }
    });
    try {
      await createConfig(customPath);
      const configPath = resolve(customPath, 'alova.config.js');
      const initialConfig = await fs.readFile(configPath, {
        encoding: 'utf-8'
      });
      expect(!!initialConfig).toBeTruthy();
    } finally {
      await rimraf(resolve(customPath)); // 清除临时目录
    }
  });
  test('should read config file under project root path', async () => {
    // write mock config file
    const projectRoot = process.cwd();
    try {
      await fs.access(projectRoot);
    } catch (error) {
      await fs.mkdir(projectRoot, { recursive: true });
    }
    // read ts file
    await fs.writeFile(resolve(projectRoot, configMap.ts.file), configMap.ts.content, 'utf-8');
    requireResult.set(projectRoot, null); // require()=> throw error
    importResult.set(projectRoot, configMap.ts.expectedConfig); // import()=> return config
    const tsConfig = await readConfig();

    expect(tsConfig).toBeDeepEqual(configMap.ts.expectedConfig);

    // read module config file
    await fs.writeFile(resolve(projectRoot, configMap.module.file), configMap.module.content, 'utf-8');
    requireResult.set(projectRoot, null); // require()=> throw error
    importResult.set(projectRoot, configMap.module.expectedConfig); // import()=> return config
    const moduleConfig = await readConfig();
    expect(moduleConfig).toBeDeepEqual(configMap.module.expectedConfig);
    // read commonjs config file
    await fs.writeFile(resolve(projectRoot, configMap.commonjs.file), configMap.commonjs.content, 'utf-8');
    requireResult.set(projectRoot, configMap.commonjs.expectedConfig); // require()=> return config
    importResult.set(projectRoot, null); // import()=> throw error
    const cjsConfig = await readConfig();
    expect(cjsConfig).toBeDeepEqual(configMap.commonjs.expectedConfig);
  });

  test('should read config file under target path', async () => {
    // read ts file
    const customPath = resolve(__dirname, './mockdir_config2');
    try {
      await fs.access(customPath);
    } catch (error) {
      await fs.mkdir(customPath, { recursive: true });
    }
    await fs.writeFile(resolve(customPath, configMap.ts.file), configMap.ts.content, 'utf-8');
    requireResult.set(customPath, null); // require()=> throw error
    importResult.set(customPath, configMap.ts.expectedConfig); // import()=> return config
    try {
      const tsConfig = await readConfig(customPath);
      expect(tsConfig).toMatchObject(configMap.ts.expectedConfig);
    } finally {
      await rimraf(customPath); // 清除临时目录
    }
  });
});
