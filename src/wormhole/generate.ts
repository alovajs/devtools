import message from '@/components/message';
import generateApi from '@/functions/generateApi';
import { Configuration } from '@/modules/Configuration';
import { getFileNameByPath } from '@/utils';

export const generate = async (projectPath: string, config?: AlovaConfig) => {
  if (!config) {
    return;
  }
  const configuration = new Configuration(config, projectPath);
  // 检查新配置
  configuration.checkConfig();
  const fileName = getFileNameByPath(configuration.workspaceRootDir);
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
        templateTypeArr[idx] ?? 'commonjs'
      )
    )
  );
  if (result.some(item => !!item)) {
    message.info(`[${fileName}]:Your API is updated`);
  }
};
export default generate;
