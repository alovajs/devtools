import { createConfig } from '@alova/wormhole';

export default async (workspaceRootPathArr: string[]) => Promise.all(workspaceRootPathArr.map(createConfig));