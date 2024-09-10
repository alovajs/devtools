import importFresh from 'import-fresh';
import path from 'node:path';
import { PackageJson } from 'type-fest';
export type AlovaVersion = `v${number}`;

export default function (workspaceRootDir: string) {
  const packageJson: PackageJson = importFresh(path.resolve(workspaceRootDir, './package.json'));
  if (!packageJson) {
    return 'v2';
  }
  // 依赖中找
  const alovaVersion = packageJson.dependencies?.alova;
  // dev依赖中找
  // 优先级： 生产依赖 > 开发依赖
  const alovaDevVersion = packageJson.devDependencies?.alova;
  // 框架技术栈标签  vue | react
  return getVersion(alovaVersion ?? alovaDevVersion);
}

export const getVersion = (version?: string): AlovaVersion => {
  const execArr = /(\d+)\./.exec(version ?? '') ?? [];
  return `v${Number(execArr[1]) || 2}`;
};
