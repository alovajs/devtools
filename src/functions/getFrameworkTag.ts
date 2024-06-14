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
  const frameTag = frameworkName.find(framework => packageJson.dependencies?.[framework]) ?? 'defaultKey';
  return frameTag;
}
