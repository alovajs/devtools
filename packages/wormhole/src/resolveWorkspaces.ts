import { glob } from 'glob';
import yaml from 'js-yaml';
import nodefs from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsPromise, resolveConfigFile } from './utils';

/**
 * Search for all directories containing alova.config configuration files under the monorepo project. It will search for configuration files based on `workspaces` in `package.json` or subpackages defined in `pnpm-workspace.yaml`
 * @param projectPath The project path to search, defaults to `process.cwd()`.
 * @returns An array of relative paths to directories containing alova.config configuration files.
 */
export default async function resolveWorkspaces(projectPath = process.cwd()) {
  const resultDirs: string[] = [];

  // Check if there is alova.config.js in the root directory

  const rootConfigPath = await resolveConfigFile(projectPath);
  if (rootConfigPath) {
    resultDirs.push(projectPath);
  }

  // Find subpackages based on workspaces in package.json or pnpm-workspace.yaml

  const packageJsonPath = path.join(projectPath, 'package.json');
  const pnpmWorkspacePathYaml = path.join(projectPath, 'pnpm-workspace.yaml');
  const pnpmWorkspacePathYml = path.join(projectPath, 'pnpm-workspace.yml');

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
    const workspaceDirs = await globPaths(projectPath, workspace);
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
