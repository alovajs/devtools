import { glob } from 'glob';
import yaml from 'js-yaml';
import nodefs from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsPromise, resolveConfigFile } from './utils';

/**
 * 查找所有包含 alova.config.js 文件的目录
 * @param rootPath 根目录
 * @returns 包含 alova.config.js 文件的目录数组
 */
export default async function resolveWorkspaces(rootPath = process.cwd()) {
  const resultDirs: string[] = [];

  // 检查根目录是否有 alova.config.js
  const rootConfigPath = await resolveConfigFile(rootPath);
  if (rootConfigPath) {
    resultDirs.push(rootPath);
  }

  // 根据 package.json 的 workspaces 或 pnpm-workspace.yaml 来查找子包
  const packageJsonPath = path.join(rootPath, 'package.json');
  const pnpmWorkspacePathYaml = path.join(rootPath, 'pnpm-workspace.yaml');
  const pnpmWorkspacePathYml = path.join(rootPath, 'pnpm-workspace.yml');

  let workspaces: string[] = [];
  // 如果存在 package.json，读取 workspaces
  if (await existsPromise(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    if (packageJson.workspaces) {
      workspaces = Array.isArray(packageJson.workspaces) ? packageJson.workspaces : packageJson.workspaces.packages;
    }
  }

  // 如果存在 pnpm-workspace.yaml，读取其中的路径
  const pnpmWorkspacePath = (await existsPromise(pnpmWorkspacePathYaml))
    ? pnpmWorkspacePathYaml
    : (await existsPromise(pnpmWorkspacePathYml))
      ? pnpmWorkspacePathYml
      : undefined;
  if (pnpmWorkspacePath) {
    const pnpmConfig = yaml.load(await fs.readFile(pnpmWorkspacePath, 'utf-8')) as { packages: string[] };
    if (pnpmConfig.packages) {
      workspaces = workspaces.concat(pnpmConfig.packages);
    }
  }

  // 去重处理
  workspaces = [...new Set(workspaces)];

  // 遍历每个子包，检查是否存在 alova.config.js
  for (const workspace of workspaces) {
    const workspaceDirs = await globPaths(rootPath, workspace);
    for (const dir of workspaceDirs) {
      const configFile = await resolveConfigFile(dir);
      if (configFile) {
        resultDirs.push(dir);
      }
    }
  }

  return resultDirs;
}

/**
 * 解析 workspace 路径
 * @param {string} rootPath 根目录
 * @param {string} workspacePattern workspace 定义的路径模式
 * @returns {Promise<string[]>} 解析后的路径列表
 */
async function globPaths(rootPath: string, workspacePattern: string): Promise<string[]> {
  const resolvedPaths: string[] = [];
  const dirs = await glob(workspacePattern, {
    ignore: 'node_modules/**',
    cwd: rootPath,
    fs: {
      ...nodefs,
      promises: fs
    }
  }); // 使用 glob 模块处理通配符
  for (const dir of dirs) {
    const absDir = path.resolve(rootPath, dir);
    resolvedPaths.push(absDir);
  }
  return resolvedPaths;
}
