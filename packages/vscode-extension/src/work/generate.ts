import { generate } from '@alova/wormhole';
import { createError } from '@/utils/work';
import { CONFIG_POOL } from './config';

interface GenerateOption {
  force?: boolean;
  projectPath?: string;
}
export default async (option?: GenerateOption) => {
  const resultArr = [];
  const errorArr = [];
  const { force = false, projectPath: projectPathValue } = option ?? {};
  for (const [projectPath, config] of CONFIG_POOL) {
    if (projectPathValue && projectPathValue !== projectPath) {
      continue;
    }
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
