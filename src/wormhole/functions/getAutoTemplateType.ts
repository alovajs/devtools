import type { TemplateType } from '@/wormhole';
import { createRequire } from 'node:module';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export default (workspaceRootDir: string): TemplateType => {
  const workspacedRequire = createRequire(workspaceRootDir);
  const packageJson: PackageJson = workspacedRequire('./package.json');
  delete workspacedRequire.cache[path.resolve(workspaceRootDir, './package.json')];
  if (packageJson?.devDependencies?.typescript) {
    return 'typescript';
  }
  return packageJson.type ?? 'module';
};
