import type { TemplateType } from '@/type';
import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export default (projectPath: string): TemplateType => {
  const packageJson: PackageJson = importFresh(path.resolve(projectPath, './package.json'));
  if (packageJson?.devDependencies?.typescript) {
    return 'typescript';
  }
  return packageJson.type ?? 'module';
};
