import createConfig from '@/createConfig';
import { readConfig } from '@/readConfig';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';

vi.mock('node:fs');
vi.mock('node:fs/promises');
let type = 'typescript';
vi.mock('@/functions/getAutoTemplateType', () => ({
  __esModule: true,
  default() {
    return type;
  }
}));
beforeEach(async () => {
  try {
    await Promise.all([
      fs.unlink(resolve(process.cwd(), 'alova.config.ts')),
      fs.unlink(resolve(process.cwd(), 'alova.config.js'))
    ]);
  } catch (error) {}
});

describe.skip('config', () => {
  test('should create config file under project root path', async () => {
    // generate typescript file
    type = 'typescript';
    await createConfig();
    const tsConfigPath = resolve(process.cwd(), 'alova.config.ts');
    const initialTsConfig = await fs.readFile(tsConfigPath, {
      encoding: 'utf-8'
    });
    expect(initialTsConfig).toMatch(`import type { Config } from '@alova/wormhole';`);
    expect(initialTsConfig).toMatch(`export default <Config>{`);
    expect(initialTsConfig).toMatch(`input: 'http://localhost:3000',`);

    // generate typescript file with alias `ts`
    type = 'ts';
    await createConfig();
    const tsConfigPath2 = resolve(process.cwd(), 'alova.config.ts');
    const initialTsConfig2 = await fs.readFile(tsConfigPath2, {
      encoding: 'utf-8'
    });
    expect(initialTsConfig2).toMatch(`import type { Config } from '@alova/wormhole';`);
    expect(initialTsConfig2).toMatch(`export default <Config>{`);
    expect(initialTsConfig2).toMatch(`input: 'http://localhost:3000',`);

    // generate commonjs file
    type = 'commonjs';
    await createConfig();
    const initialCjsConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.js'), {
      encoding: 'utf-8'
    });
    expect(initialCjsConfig).toMatch(`@type { import('@alova/wormhole').Config }`);
    expect(initialCjsConfig).toMatch(`module.exports = {`);

    // generate module file
    type = 'module';
    await createConfig();
    const initialEsmoduleConfig = await fs.readFile(resolve(process.cwd(), 'alova.config.js'), {
      encoding: 'utf-8'
    });
    expect(initialEsmoduleConfig).toMatch(`@type { import('@alova/wormhole').Config }`);
    expect(initialEsmoduleConfig).toMatch(`export default {`);
  });

  test('should create config file under custom path', async () => {
    type = 'commonjs';
    const customPath = '/mockdir_config';
    await createConfig(customPath);
    const configPath = resolve(customPath, 'alova.config.js');
    const initialConfig = await fs.readFile(configPath, {
      encoding: 'utf-8'
    });
    expect(!!initialConfig).toBeTruthy();
  });

  const configMap = {
    ts: {
      file: 'alova.config.ts',
      content: `import type { Config } from '@alova/wormhole';
export default <Config>{
  generator: [
    {
      input: 'http://localhost:3000',
      output: 'src/api',
      type: 'ts',
      version: 'v3',
      handleApi: () => 1
    }
  ]
}`
    },
    module: {
      file: 'alova.config.js',
      content: `export default {
  generator: [
    {
      input: 'http://localhost:3000',
      output: 'src/api',
      type: 'module',
      version: 'v3',
      handleApi: () => 1
    }
  ]        
}`
    },
    commonjs: {
      file: 'alova.config.js',
      content: `module.exports = {
  generator: [
    {
      input: 'http://localhost:3000',
      output: 'src/api',
      type: 'commonjs',
      version: 'v3',
      handleApi: () => 1
    }
  ]        
}`
    }
  };
  test('should read config file under project root path', async () => {
    // write mock config file
    const projectRoot = process.cwd();
    try {
      await fs.access(projectRoot);
    } catch (error) {
      await fs.mkdir(projectRoot, { recursive: true });
    }
    await fs.writeFile(resolve(projectRoot, configMap.ts.file), configMap.ts.content, 'utf-8');

    // read ts file
    const tsConfig = await readConfig();
    expect(tsConfig).toStrictEqual({
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'ts',
          version: 'v3',
          handleApi: () => 1
        }
      ]
    });
    await fs.unlink(resolve(projectRoot, configMap.ts.file)); // delete ts file

    // read module config file
    await fs.writeFile(resolve(projectRoot, configMap.module.file), configMap.module.content, 'utf-8');
    const moduleConfig = await readConfig();
    expect(moduleConfig).toStrictEqual({
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'module',
          version: 'v3',
          handleApi: () => 1
        }
      ]
    });

    // read commonjs config file
    await fs.writeFile(resolve(projectRoot, configMap.commonjs.file), configMap.commonjs.content, 'utf-8');
    const cjsConfig = await readConfig();
    expect(cjsConfig).toStrictEqual({
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'commonjs',
          version: 'v3',
          handleApi: () => 1
        }
      ]
    });
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
    const tsConfig = await readConfig(customPath);
    expect(tsConfig).toMatchObject({
      generator: [
        {
          input: 'http://localhost:3000',
          output: 'src/api',
          type: 'ts',
          version: 'v3',
          handleApi: () => 1
        }
      ]
    });
  });
});
