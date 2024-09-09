import { generate } from '@alova/wormhole';
import { createError } from '@/utils/work';
import { CONFIG_POOL } from './config';

export default async (force: boolean) => {
  const resultArr = [];
  const errorArr = [];
  for (const [projectPath, config] of CONFIG_POOL) {
    try {
      const generateResult = await generate(config, {
        force,
        projectPath
      });
      resultArr.push([projectPath, generateResult?.some(item => !!item)]);
    } catch (error: any) {
      errorArr.push([projectPath, createError(error)]);
    }
  }
  return {
    resultArr,
    errorArr
  };
};
