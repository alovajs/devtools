import womhole from '@/helper/wormhole';

export default async (workspaceRootPath: string) => womhole.createConfig({ projectPath: workspaceRootPath });
