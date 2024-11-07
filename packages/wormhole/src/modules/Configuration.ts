import { getGlobalConfig } from '@/config';
import { getAlovaJsonPath, readAlovaJson } from '@/functions/alovaJson';
import getAutoTemplateType from '@/functions/getAutoTemplateType';
import getOpenApiData from '@/functions/getOpenApiData';
import { isValidJSIdentifier } from '@/helper/standard';
import type { Config, GeneratorConfig, TemplateType } from '@/interface.type';
import { isEmpty } from '@/utils';
import path from 'node:path';

const DEFAULT_CONFIG = getGlobalConfig();
export default class Configuration {
  config: Config;

  workspaceRootDir: string;

  constructor(config: Config, workspaceRootDir: string) {
    // Configuration file

    this.config = config;
    this.workspaceRootDir = workspaceRootDir;
  }

  // Detect configuration file

  checkConfig() {
    if (!this.config.generator?.length) {
      throw new DEFAULT_CONFIG.Error('No items found in the `config.generator`');
    }
    const globalKeySet = new Set<string>();
    const outputSet = new Set<string>();
    this.config.generator.forEach((item, _, arr) => {
      if (!item.input) {
        throw new DEFAULT_CONFIG.Error('Field input is required in `config.generator`');
      }
      if (!item.output) {
        throw new DEFAULT_CONFIG.Error('Field output is required in `config.generator`');
      }
      const { global } = item;
      if (!isEmpty(global) && !isValidJSIdentifier(global)) {
        throw new DEFAULT_CONFIG.Error(`\`${global}\` does not match variable specification`);
      }
      if (arr.length < 2) {
        return;
      }
      if (outputSet.has(path.join(item.output))) {
        throw new DEFAULT_CONFIG.Error(`output \`${item.output}\` is repated`);
      }
      outputSet.add(path.join(item.output));
      if (!global) {
        throw new DEFAULT_CONFIG.Error('Field global is required in `config.generator`');
      }
      if (globalKeySet.has(global)) {
        throw new DEFAULT_CONFIG.Error(`global \`${global}\` is repated`);
      }
      globalKeySet.add(global);
    });
    if (typeof this.config.autoUpdate === 'object') {
      const { interval } = this.config.autoUpdate;
      const time = Number(interval);
      if (Number.isNaN(time)) {
        throw new DEFAULT_CONFIG.Error('autoUpdate.interval must be a number');
      }
      if (time <= 0) {
        // at least one second

        throw new DEFAULT_CONFIG.Error('Expected to set number which great than 1 in `config.autoUpdate.interval`');
      }
    }
  }

  static getTemplateType(workspaceRootDir: string, generator: GeneratorConfig): TemplateType {
    let type: TemplateType;
    const configType = generator.type ?? 'auto';
    // Determine the template type based on the type in the configuration file

    switch (configType) {
      case 'ts':
      case 'typescript':
        type = 'typescript';
        break;
      case 'module':
        type = 'module';
        break;
      case 'auto':
        type = getAutoTemplateType(workspaceRootDir);
        break;
      default:
        type = 'commonjs';
        break;
    }
    return type;
  }

  getAllTemplateType() {
    return this.config.generator.map(generator => Configuration.getTemplateType(this.workspaceRootDir, generator));
  }

  getAllOutputPath(): string[] {
    return this.config.generator.map(generator => generator.output);
  }

  // Get openapi data

  static getOpenApiData(workspaceRootDir: string, generator: GeneratorConfig) {
    return getOpenApiData(workspaceRootDir, generator.input, generator.platform);
  }

  // Get all openapi data

  getAllOpenApiData() {
    return Promise.all(
      this.config.generator.map(generator => Configuration.getOpenApiData(this.workspaceRootDir, generator))
    );
  }

  getAutoUpdateConfig() {
    const autoUpdateConfig = this.config.autoUpdate;
    let time = 60 * 5; // Default five minutes

    let immediate = false;
    if (typeof autoUpdateConfig === 'object') {
      time = Number(autoUpdateConfig.interval);
      immediate = !!autoUpdateConfig.launchEditor;
    }
    return {
      time,
      immediate
    };
  }

  readAlovaJson() {
    const allAlovaJSon = this.config.generator.map(generator => {
      const alovaJsonPath = getAlovaJsonPath(this.workspaceRootDir, generator.output);
      return readAlovaJson(alovaJsonPath)
        .then(alovaJson => {
          DEFAULT_CONFIG.templateData.set(alovaJsonPath, alovaJson);
          return alovaJson;
        })
        .catch(() => {
          DEFAULT_CONFIG.templateData.delete(alovaJsonPath);
          return {};
        });
    });
    return Promise.all(allAlovaJSon);
  }
}
