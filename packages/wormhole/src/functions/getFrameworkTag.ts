import type { FrameworkName } from '@/type';
import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export const frameworkNames: FrameworkName[] = ['vue', 'react'];
export default function (projectPath: string) {
  const packageJson: PackageJson = importFresh(path.resolve(projectPath, './package.json'));
  if (!packageJson) {
    return 'defaultKey';
  }
  // Framework technology stack tag vue | react
  // Find in dependencies
  const frameTag = frameworkNames.find(framework => packageJson.dependencies?.[framework]);
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const devFrameTag = frameworkNames.find(framework => packageJson.devDependencies?.[framework]);
  return frameTag ?? devFrameTag ?? 'defaultKey';
}
