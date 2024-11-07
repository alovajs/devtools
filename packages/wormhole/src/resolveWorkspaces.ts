import { glob } from 'glob';
import yaml from 'js-yaml';
import nodefs from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsPromise, resolveConfigFile } from './utils';

/**
 * Find all directories containing alova.config.js files
 * @param rootPath root directory
 * @returns Array of directories containing alova.config.js files
 */
export default async function resolveWorkspaces(rootPath = process.cwd()) {
  const resultDirs: string[] = [];

  // Check if there is alova.config.js in the root directory

  const rootConfigPath = await resolveConfigFile(rootPath);
  if (rootConfigPath) {
    resultDirs.push(rootPath);
  }

  // Find subpackages based on workspaces in package.json or pnpm-workspace.yaml

  const packageJsonPath = path.join(rootPath, 'package.json');
  const pnpmWorkspacePathYaml = path.join(rootPath, 'pnpm-workspace.yaml');
  const pnpmWorkspacePathYml = path.join(rootPath, 'pnpm-workspace.yml');

  let workspaces: string[] = [];
  // If package.json exists, read workspaces

  if (await existsPromise(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    if (packageJson.workspaces) {
      workspaces = Array.isArray(packageJson.workspaces) ? packageJson.workspaces : packageJson.workspaces.packages;
    }
  }

  // If pnpm-workspace.yaml exists, read the path in it

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

  // Deduplication

  workspaces = [...new Set(workspaces)];

  // Iterate through each sub-package and check if alova.config.js exists

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
 * Parse workspace path
 * @param {string} rootPath root directory
 * @param {string} workspacePattern Path pattern defined by workspace
 * @returns {Promise<string[]>} Parsed path list
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
  }); // Using the glob module to handle wildcards

  for (const dir of dirs) {
    const absDir = path.resolve(rootPath, dir);
    resolvedPaths.push(absDir);
  }
  return resolvedPaths;
}
