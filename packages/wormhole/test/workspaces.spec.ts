import resolveWorkspaces from '@/resolveWorkspaces';
import { existsPromise } from '@/utils';
import fs from 'node:fs/promises';
import path from 'node:path';

vi.mock('node:fs');
vi.mock('node:fs/promises');
/**
 * 根据给定的文件结构对象创建文件和目录
 * @param {string} rootPath 根路径
 * @param {Record<string, any>} structure 文件结构对象
 */
async function createProjectStructure(structure: Record<string, any>, rootPath = process.cwd()) {
  if (!(await existsPromise(rootPath))) {
    await fs.mkdir(rootPath, { recursive: true });
  }
  // 遍历文件结构
  for (const key in structure) {
    const item = structure[key];
    const itemPath = path.join(rootPath, key);

    if (typeof item === 'string') {
      // 如果是字符串，创建文件并写入内容
      await fs.writeFile(itemPath, item);
    } else if (typeof item === 'object' && item !== null) {
      // 如果是对象，创建目录并递归处理其内容
      if (!(await existsPromise(itemPath))) {
        await fs.mkdir(itemPath);
      }
      createProjectStructure(item, itemPath);
    }
  }
  return () => fs.rm(rootPath, { recursive: true, force: true });
}
afterEach(async () => {
  await fs.rm(process.cwd(), { recursive: true, force: true });
});

describe('resolve workspaces', () => {
  test("shouldn't resolve any workspace when not found config in projects", async () => {
    await createProjectStructure({
      'package.json': JSON.stringify({
        name: 'test-pkg',
        version: '0.0.1'
      }),
      src: {},
      packages: {
        'test-pkg-1': {
          'package.json': JSON.stringify({
            name: 'test-pkg-1',
            version: '0.0.1'
          }),
          'alova.config.ts': ''
        },
        'test-pkg-2': {
          'package.json': JSON.stringify({
            name: 'test-pkg-2',
            version: '0.0.1'
          }),
          'alova.config.js': ''
        }
      }
    });
    await expect(resolveWorkspaces()).resolves.toStrictEqual([]);
  });
  test('should resolve a single workspace(root) when project is not monorepo', async () => {
    const rootPath = process.cwd();
    await createProjectStructure({
      'package.json': JSON.stringify({
        name: 'test-pkg',
        version: '0.0.1'
      }),
      'alova.config.ts': '',
      src: {},
      packages: {
        'test-pkg-1': {
          'package.json': JSON.stringify({
            name: 'test-pkg-1',
            version: '0.0.1'
          }),
          'alova.config.ts': ''
        },
        'test-pkg-2': {
          'package.json': JSON.stringify({
            name: 'test-pkg-2',
            version: '0.0.1'
          }),
          'alova.config.js': ''
        }
      }
    });
    await expect(resolveWorkspaces()).resolves.toStrictEqual([rootPath]);
  });
  test('should resolve multiple workspaces when `workspaces` column in `package.json` is set', async () => {
    const rootPath = process.cwd();
    const globMatches = [path.join(rootPath, 'packages/test-pkg-2'), path.join(rootPath, 'packages/test-pkg-1')];
    await createProjectStructure({
      'package.json': JSON.stringify({
        name: 'test-pkg',
        version: '0.0.1',
        workspaces: ['packages/*']
      }),
      'alova.config.ts': '',
      src: {},
      packages: {
        'test-pkg-1': {
          'package.json': JSON.stringify({
            name: 'test-pkg-1',
            version: '0.0.1'
          }),
          'alova.config.ts': ''
        },
        'test-pkg-2': {
          'package.json': JSON.stringify({
            name: 'test-pkg-2',
            version: '0.0.1'
          }),
          'alova.config.js': ''
        }
      }
    });

    await expect(resolveWorkspaces()).resolves.toStrictEqual([rootPath, ...globMatches]);
  });

  test('should resolve multiple workspaces when `pnpm-workspace.yml` is exist', async () => {
    const rootPath = process.cwd();
    const globMatches = [path.join(rootPath, 'packages/test-pkg-2'), path.join(rootPath, 'packages/test-pkg-1')];
    await createProjectStructure({
      'package.json': JSON.stringify({
        name: 'test-pkg',
        version: '0.0.1'
      }),
      'pnpm-workspace.yml': `
packages:
  - packages/*`,
      'alova.config.ts': '',
      src: {},
      packages: {
        'test-pkg-1': {
          'package.json': JSON.stringify({
            name: 'test-pkg-1',
            version: '0.0.1'
          }),
          'alova.config.ts': ''
        },
        'test-pkg-2': {
          'package.json': JSON.stringify({
            name: 'test-pkg-2',
            version: '0.0.1'
          }),
          'alova.config.js': ''
        }
      }
    });

    await expect(resolveWorkspaces()).resolves.toStrictEqual([rootPath, ...globMatches]);
  });

  test('should concat the workspaces of `package.json` and `pnpm-workspace.yaml`', async () => {
    const rootPath = process.cwd();
    await createProjectStructure({
      'package.json': JSON.stringify({
        name: 'test-pkg',
        version: '0.0.1',
        workspaces: ['packages/*']
      }),
      'pnpm-workspace.yaml': `
packages:
  - test/*`,
      src: {},
      packages: {
        'test-pkg-1': {
          'package.json': JSON.stringify({
            name: 'test-pkg-1',
            version: '0.0.1'
          }),
          'alova.config.ts': ''
        },
        'test-pkg-2': {
          'package.json': JSON.stringify({
            name: 'test-pkg-2',
            version: '0.0.1'
          })
        }
      },
      test: {
        'test-pkg-3': {
          'package.json': JSON.stringify({
            name: 'test',
            version: '0.0.1'
          }),
          'alova.config.cjs': ''
        }
      }
    });

    await expect(resolveWorkspaces()).resolves.toStrictEqual([
      path.join(rootPath, 'packages/test-pkg-1'),
      path.join(rootPath, 'test/test-pkg-3')
    ]);
  });

  test('should resolve workspaces under custom root path', async () => {
    const rootPath = path.resolve(__dirname, './mock_workspace');
    const globMatches = [path.join(rootPath, 'packages/test-pkg-2'), path.join(rootPath, 'packages/test-pkg-1')];
    await createProjectStructure(
      {
        'package.json': JSON.stringify({
          name: 'test-pkg',
          version: '0.0.1',
          workspaces: ['packages/*']
        }),
        'alova.config.ts': '',
        src: {},
        packages: {
          'test-pkg-1': {
            'package.json': JSON.stringify({
              name: 'test-pkg-1',
              version: '0.0.1'
            }),
            'alova.config.ts': ''
          },
          'test-pkg-2': {
            'package.json': JSON.stringify({
              name: 'test-pkg-2',
              version: '0.0.1'
            }),
            'alova.config.js': ''
          }
        }
      },
      rootPath
    );

    await expect(resolveWorkspaces(rootPath)).resolves.toStrictEqual([rootPath, ...globMatches]);
  });
});
