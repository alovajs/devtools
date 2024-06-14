import { createRequire } from 'node:module';
import { PackageJson } from 'type-fest';
import { frameworkName } from '../globalConfig';
export default function (workspaceRootDir: string) {
  const workspacedRequire = createRequire(workspaceRootDir);
  const packageJson: PackageJson = workspacedRequire('./package.json');
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
