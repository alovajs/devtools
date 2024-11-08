import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export type AlovaVersion = `v${number}`;
export default function (workspaceRootDir: string) {
  const packageJson: PackageJson = importFresh(path.resolve(workspaceRootDir, './package.json'));
  if (!packageJson) {
    return 'v3';
  }
  // Find in dependencies
  const alovaVersion = packageJson.dependencies?.alova;
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const alovaDevVersion = packageJson.devDependencies?.alova;
  // Framework technology stack tag vue | react
  return getVersion(alovaVersion ?? alovaDevVersion);
}

export const getVersion = (version?: string): AlovaVersion => {
  const execArr = /(\d+)\./.exec(version ?? '') ?? [];
  return `v${Number(execArr[1]) || 3}`;
};
