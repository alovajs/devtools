import type { Config, GenerateApiOptions } from '~/index';
import generateApi from './functions/generateApi';
import Configuration from './modules/Configuration';

export const generate = async (config: Config, options?: GenerateApiOptions): Promise<void | (boolean | void)[]> => {
  if (!config) {
    return;
  }
  const configuration = new Configuration(config, options?.projectPath ?? process.cwd());
  // 检查新配置
  configuration.checkConfig();
  const outputPathArr = configuration.getAllOutputPath();
  const templateTypeArr = configuration.getAllTemplateType();
  const openApiData = await configuration.getAllOpenApiData();
  const generatorConfigArr = configuration.config.generator;
  const result = await Promise.all(
    outputPathArr.map((outputPath, idx) =>
      // 生成api文件
      generateApi(
        configuration.workspaceRootDir,
        outputPath,
        openApiData[idx],
        generatorConfigArr[idx],
        templateTypeArr[idx] ?? 'commonjs',
        options?.force ?? false
      )
    )
  );
  return result;
};
export default generate;
