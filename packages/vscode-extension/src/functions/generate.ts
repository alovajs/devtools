import Error from '@/components/error';
import { CONFIG_POOL } from '@/helper/config';
import wormhole from '@/helper/wormhole';

interface GenerateOption {
  force?: boolean;
  projectPath?: string;
  showError?: boolean;
}
export default async (option?: GenerateOption) => {
  const resultArr: Array<[string, boolean]> = [];
  const errorArr: Array<Error> = [];
  const { force = false, projectPath: projectPathValue, showError = false } = option ?? {};
  for (const [projectPath, config] of CONFIG_POOL) {
    if (projectPathValue && projectPathValue !== projectPath) {
      continue;
    }
    try {
      const generateResult = await wormhole.generate(config, {
        force,
        projectPath
      });
      resultArr.push([projectPath, generateResult?.some(item => !!item)]);
    } catch (err) {
      const error = err as Error;
      error?.setPath?.(projectPath);
      errorArr.push(error);
    }
  }
  if (showError && errorArr.length > 0) {
    errorArr.forEach(error => {
      throw error;
    });
  }
  return {
    resultArr,
    errorArr
  };
};
