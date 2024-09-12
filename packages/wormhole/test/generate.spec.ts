import generate from '@/generate';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';

vi.mock('node:fs');
vi.mock('node:fs/promises');
describe('generate API', () => {
  test('should throw error when necessary items are not specified', async () => {
    await expect(generate({} as any)).rejects.toThrow('No items found in the `config.generator`');
    await expect(
      generate({
        generator: [{} as any]
      })
    ).rejects.toThrow('Field input is required in `config.generator`');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json'
          }
        ]
      } as any)
    ).rejects.toThrow('Field output is required in `config.generator`');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: '1243sadf'
          }
        ]
      })
    ).rejects.toThrow('does not match variable specification');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf&*^^&%'
          }
        ]
      })
    ).rejects.toThrow('does not match variable specification');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf__$$123'
          },
          {
            input: 'http://localhost:3000/openapi2.json',
            output: './src/api'
          }
        ]
      })
    ).rejects.toThrow('output `./src/api` is repated');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf__$$123'
          },
          {
            input: 'http://localhost:3000/openapi2.json',
            output: './src/api2'
          }
        ]
      })
    ).rejects.toThrow('Field global is required in `config.generator`');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api',
            global: 'asdf__$$123'
          },
          {
            input: 'http://localhost:3000/openapi2.json',
            output: './src/api2',
            global: 'asdf__$$123'
          }
        ]
      })
    ).rejects.toThrow('global `asdf__$$123` is repated');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api'
          }
        ],
        autoUpdate: {
          interval: 'abc' as any
        }
      })
    ).rejects.toThrow('autoUpdate.interval must be a number');
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api'
          }
        ],
        autoUpdate: {
          interval: -1
        }
      })
    ).rejects.toThrow('Expected to set number which great than 1 in `config.autoUpdate.interval`');
  });

  test('should throw error when generating from a file that does not exists', async () => {
    await expect(
      generate({
        generator: [
          {
            input: 'http://localhost:3000/openapi.json',
            output: './src/api'
          }
        ]
      })
    ).rejects.toThrow('Cannot read file from http://localhost:3000/openapi.json');
  });

  test('should generate code with a variant of openapi file formats', async () => {
    const outputDir = resolve(__dirname, './mock_output/openapi_301');
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir
        }
      ]
    });
    expect(await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')).toMatchSnapshot();

    const outputDir2 = resolve(__dirname, './mock_output/swagger_2');
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/swagger_2.json'),
          output: outputDir2
        }
      ]
    });
    expect(await fs.readFile(resolve(outputDir2, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir2, 'index.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir2, 'createApis.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir2, 'globals.d.ts'), 'utf-8')).toMatchSnapshot();

    const outputDir3 = resolve(__dirname, './mock_output/openapi_300');
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_300.yaml'),
          output: outputDir3
        }
      ]
    });
    expect(await fs.readFile(resolve(outputDir3, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir3, 'index.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir3, 'createApis.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir3, 'globals.d.ts'), 'utf-8')).toMatchSnapshot();
  });

  test('should generate target versioned code', async () => {
    const outputDir = resolve(__dirname, './mock_output/openapi_301');
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir,
          version: 2
        }
      ]
    });
    expect(await fs.readFile(resolve(outputDir, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir, 'index.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir, 'createApis.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir, 'globals.d.ts'), 'utf-8')).toMatchSnapshot();

    const outputDir2 = resolve(__dirname, './mock_output/openapi_301');
    await generate({
      generator: [
        {
          input: resolve(__dirname, './openapis/openapi_301.json'),
          output: outputDir2,
          version: 3
        }
      ]
    });
    expect(await fs.readFile(resolve(outputDir2, 'apiDefinitions.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir2, 'index.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir2, 'createApis.ts'), 'utf-8')).toMatchSnapshot();
    expect(await fs.readFile(resolve(outputDir2, 'globals.d.ts'), 'utf-8')).toMatchSnapshot();
  });
});
