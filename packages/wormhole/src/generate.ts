import type { Config, GenerateApiOptions } from '@/interface.type';
import generateApi from './functions/generateApi';
import Configuration from './modules/Configuration';

/**
 * generate apis based on config
 * @param config generating config
 * @param rules config rules
 * @returns
 */
const generate = async (config: Config, rules?: GenerateApiOptions) => {
  if (!config) {
    return [] as boolean[];
  }
  const configuration = new Configuration(config, rules?.projectPath ?? process.cwd());

  // Check new configuration
  configuration.checkConfig();
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
