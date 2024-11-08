import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export const frameworkName: ['vue', 'react'] = ['vue', 'react'];
export default function (workspaceRootDir: string) {
  const packageJson: PackageJson = importFresh(path.resolve(workspaceRootDir, './package.json'));
  if (!packageJson) {
    return 'defaultKey';
  }
  // Framework technology stack tag vue | react
  // Find in dependencies
  const frameTag = frameworkName.find(framework => packageJson.dependencies?.[framework]);
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const devFrameTag = frameworkName.find(framework => packageJson.devDependencies?.[framework]);
  return frameTag ?? devFrameTag ?? 'defaultKey';
}
