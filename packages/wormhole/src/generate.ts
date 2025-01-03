import type { Config, GenerateApiOptions } from '@/interface.type';
import generateApi from './functions/generateApi';
import Configuration from './modules/Configuration';

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
  const configuration = new Configuration(config, rules?.projectPath ?? process.cwd());
  const outputPathArr = configuration.getAllOutputPath();
  const templateTypeArr = configuration.getAllTemplateType();
  const openApiData = await configuration.getAllOpenApiData();
  const generatorConfigArr = configuration.config.generator;
  const result = await Promise.all(
    outputPathArr.map((outputPath, idx) =>
      // Generate api file
      generateApi(
        configuration.workspaceRootDir,
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
