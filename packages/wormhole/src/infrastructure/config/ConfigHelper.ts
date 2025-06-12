import { getGlobalConfig } from '@/config';
import { getAlovaJsonPath, readAlovaJson } from '@/functions/alovaJson';
import { isArray, isObject } from 'lodash';
import { ConfigManager } from './ConfigManager';
import { GeneratorHelper } from './GeneratorHelper';
import type { Config, GeneratorConfig } from './types';

const DEFAULT_CONFIG = getGlobalConfig();
export class ConfigHelper {
  private static instance: ConfigHelper;
  private configManager = ConfigManager.getInstance();
  private projectPath: string;
  public static getInstance(): ConfigHelper {
    if (!ConfigHelper.instance) {
      ConfigHelper.instance = new ConfigHelper();
    }
    return ConfigHelper.instance;
  }
  public async load(config: Partial<Config>, projectPath = process.cwd()): Promise<void> {
    this.projectPath = projectPath;
    await this.configManager.load(config);
    await this.readAlovaJson();
  }

  public getConfig() {
    return this.configManager.getConfig();
  }
  public getProjectPath() {
    return this.projectPath;
  }
  public getTemplateType(idx?: number | number[]) {
    const { generator } = this.configManager.getConfig();
    const templateType = (config: GeneratorConfig) => GeneratorHelper.getTemplateType(config, this.projectPath);
    if (isArray(idx)) {
      return generator.filter((_, index) => idx.includes(index)).map(item => templateType(item));
    }
    if (idx !== undefined && idx < generator.length && idx >= 0) {
      return [templateType(generator[idx])];
    }
    return generator.map(item => templateType(item));
  }
  public getOutput() {
    return this.configManager.getConfig().generator.map(item => item.output);
  }

  public getOpenApiData() {
    return Promise.all(
      this.configManager.getConfig().generator.map(item => GeneratorHelper.openApiData(item, this.projectPath))
    );
  }
  public autoUpdateConfig() {
    const autoUpdateConfig = this.configManager.getConfig().autoUpdate;
    let time = 60 * 5; // Default five minutes
    let immediate = false;
    const isStop = !autoUpdateConfig;
    if (isObject(autoUpdateConfig)) {
      time = Number(autoUpdateConfig.interval);
      immediate = !!autoUpdateConfig.launchEditor;
    }
    return {
      time,
      isStop,
      immediate
    };
  }
  private readAlovaJson() {
    const allAlovaJSon = this.configManager.getConfig().generator.map(async generator => {
      const alovaJsonPath = getAlovaJsonPath(this.projectPath, generator.output);
      try {
        const alovaJson = await readAlovaJson(alovaJsonPath);
        DEFAULT_CONFIG.templateData.set(alovaJsonPath, alovaJson);
        return alovaJson;
      } catch {
        DEFAULT_CONFIG.templateData.delete(alovaJsonPath);
        return {};
      }
    });
    return Promise.all(allAlovaJSon);
  }
}

export const configHelper = ConfigHelper.getInstance();
