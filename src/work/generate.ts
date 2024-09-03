import { generate } from '@alova/wormhole';
import { CONFIG_POOL } from './config';

export default async (force: boolean) => {
  const resultArr = [];
  const errorArr = [];
  for (const configuration of CONFIG_POOL) {
    try {
      const generateResult = await generate(configuration.config, {
        force,
        projectPath: configuration.workspaceRootDir
      });
      resultArr.push([configuration.workspaceRootDir, generateResult?.some(item => !!item)]);
    } catch (error) {
      errorArr.push([configuration.workspaceRootDir, error]);
    }
  }
  return {
    resultArr,
    errorArr
  };
};
