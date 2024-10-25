import { createConfig } from '@/helper/wormhole';

export default async (workspaceRootPathArr: string[]) =>
  Promise.all(workspaceRootPathArr.map(workspaceRootPath => createConfig({ projectPath: workspaceRootPath })));
