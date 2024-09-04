import { generate } from '@alova/wormhole';
import { createError } from '../utils/work';
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
    } catch (error: any) {
      errorArr.push([configuration.workspaceRootDir, createError(error)]);
    }
  }
  return {
    resultArr,
    errorArr
  };
};
