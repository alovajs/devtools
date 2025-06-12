import { configHelper } from '@/infrastructure/config/ConfigHelper';
import type { Config } from '@/infrastructure/config/types';
import type { GenerateApiOptions } from '@/interface.type';
import generateApi from './functions/generateApi';
/**
 * Generate relevant API information based on the configuration object. Generally, it needs to be used with `readConfig()`.
 * @param config generating config
 * @param rules config rules that contains `force`, `projectPath`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
const generate = async (config: Config, rules?: GenerateApiOptions) => {
  if (!config) {
    return [] as boolean[];
  }
  await configHelper.load(config, rules?.projectPath ?? process.cwd());
  const outputPathArr = configHelper.getOutput();
  const templateTypeArr = configHelper.getTemplateType();
  const openApiData = await configHelper.getOpenApiData();
  const generatorConfigArr = configHelper.getConfig().generator;
  const result = await Promise.all(
    outputPathArr.map((outputPath, idx) =>
      // Generate api file
      generateApi(
        configHelper.getProjectPath(),
        outputPath,
        openApiData[idx],
        generatorConfigArr[idx],
        templateTypeArr[idx] ?? 'commonjs',
        rules?.force ?? false
      )
    )
  );
  return result;
};
export default generate;
