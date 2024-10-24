import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';

export const frameworkName: ['vue', 'react'] = ['vue', 'react'];
export default function (workspaceRootDir: string) {
  const packageJson: PackageJson = importFresh(path.resolve(workspaceRootDir, './package.json'));
  if (!packageJson) {
    return 'defaultKey';
  }
  // 框架技术栈标签  vue | react
  // 依赖中找
  const frameTag = frameworkName.find(framework => packageJson.dependencies?.[framework]);
  // dev依赖中找
  // 优先级： 生产依赖 > 开发依赖
  const devFrameTag = frameworkName.find(framework => packageJson.devDependencies?.[framework]);
  return frameTag ?? devFrameTag ?? 'defaultKey';
}
