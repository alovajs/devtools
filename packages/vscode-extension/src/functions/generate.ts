import wormhole from '@/helper/wormhole';
import { CONFIG_POOL } from '@/helper/config';
import AlovaError from '@/components/error';

interface GenerateOption {
  force?: boolean;
  projectPath?: string;
}
export default async (option?: GenerateOption) => {
  const resultArr: Array<[string, boolean]> = [];
  const errorArr: Array<[string, AlovaError]> = [];
  const { force = false, projectPath: projectPathValue } = option ?? {};
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
    } catch (error: any) {
      errorArr.push([projectPath, error]);
    }
  }
  return {
    resultArr,
    errorArr
  };
};
