import type { TemplateType } from '@/type/base';
import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export default (workspaceRootDir: string): TemplateType => {
  const packageJson: PackageJson = importFresh(path.resolve(workspaceRootDir, './package.json'));
  if (packageJson?.devDependencies?.typescript) {
    return 'typescript';
  }
  return packageJson.type ?? 'module';
};
