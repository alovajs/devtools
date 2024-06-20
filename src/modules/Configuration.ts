import * as vscode from 'vscode';
import generateApi from '../commands/generateApi';
import getOpenApiData from '../functions/getOpenApiData';
import getAutoTemplateType from '../functions/getAutoTemplateType';
import { highPrecisionInterval } from '../utils';
import { readAlovaJson, TEMPLATE_DATA } from '../modules/TemplateFile';
import path from 'node:path';
export const CONFIG_POOL: Array<Configuration> = [];
export class Configuration {
  config: AlovaConfig;
  workspaceRootDir: string;
  autoUpdateControl: ReturnType<typeof highPrecisionInterval>;
  // 是否应该开始更新api
  shouldUpdate: boolean;
  constructor(config: AlovaConfig, workspaceRootDir: string) {
    //配置文件
    this.config = config;
    this.workspaceRootDir = workspaceRootDir;
  }
  getTemplateType(generator: GeneratorConfig): TemplateType {
    let type: TemplateType;
    const configType = generator.type ?? 'auto';
    //根据配置文件中的type来判断模板类型
    switch (configType) {
      case 'ts':
      case 'typescript':
        type = 'typescript';
        break;
      case 'module':
        type = 'module';
        break;
      case 'auto':
        type = getAutoTemplateType(this.workspaceRootDir);
        break;
      default:
        type = 'commonjs';
        break;
    }
    return type;
  }
  getAllTemplateType() {
    return this.config.generator.map(generator => this.getTemplateType(generator));
  }
  getOutputPath(generator: GeneratorConfig) {
    return generator.output;
  }
  getAllOutputPath() {
    return this.config.generator.map(generator => this.getOutputPath(generator));
  }
  // 获取openapi数据
  getOpenApiData(generator: GeneratorConfig) {
    return getOpenApiData(this.workspaceRootDir, generator.input, generator.platform);
  }
  // 获取所有openapi数据
  getAllOpenApiData() {
    return Promise.all(this.config.generator.map(generator => this.getOpenApiData(generator)));
  }
  private getAutoUpdateConfig() {
    const autoUpdateConfig = this.config.autoUpdate;
    let time = 1000 * 60 * 5;
    let immediate = false;
    if (typeof autoUpdateConfig === 'object') {
      time = autoUpdateConfig.interval;
      immediate = !!autoUpdateConfig.launchEditor;
    }
    return {
      time,
      immediate
    };
  }
  autoUpdate() {
    const autoUpdateConfig = this.config.autoUpdate;
    if (!autoUpdateConfig) {
      return;
    }
    const { time, immediate } = this.getAutoUpdateConfig();
    this.autoUpdateControl = highPrecisionInterval(
      () => {
        vscode.commands.executeCommand(generateApi.commandId);
        this.shouldUpdate = true;
      },
      time,
      immediate
    );
    return this.autoUpdateControl;
  }
  closeAutoUpdate() {
    this.autoUpdateControl?.clear?.();
  }
  refreshAutoUpdate() {
    const autoUpdateConfig = this.config.autoUpdate;
    if (!autoUpdateConfig) {
      this.closeAutoUpdate();
      return;
    }
    const { time, immediate } = this.getAutoUpdateConfig();
    const { time: oldTime, immediate: oldImmediate, isRunning } = this.autoUpdateControl || {};
    if (time === oldTime && oldImmediate === immediate && isRunning()) {
      return;
    }
    this.closeAutoUpdate();
    this.autoUpdate();
  }
  readAlovaJson() {
    const allAlovaJSon = this.config.generator.map(generator => {
      const alovaJsonPath = path.join(this.workspaceRootDir, generator.output);
      return readAlovaJson(alovaJsonPath)
        .then(alovaJson => {
          TEMPLATE_DATA.set(alovaJsonPath, alovaJson);
          return alovaJson;
        })
        .catch(() => {
          return {};
        });
    });
    return Promise.all(allAlovaJSon);
  }
}
