import womhole from '@/helper/wormhole';

export default async (workspaceRootPathArr: string[]) =>
  Promise.all(workspaceRootPathArr.map(workspaceRootPath => womhole.createConfig({ projectPath: workspaceRootPath })));
