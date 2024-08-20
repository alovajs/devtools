import generateApi from '@/functions/generateApi';
import { Configuration } from '@/modules/Configuration';

export const generate = async (projectPath: string, config?: AlovaConfig, options = { force: false }) => {
  if (!config) {
    return;
  }
  const configuration = new Configuration(config, projectPath);
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
        options.force
      )
    )
  );
  return result;
};
export default generate;
