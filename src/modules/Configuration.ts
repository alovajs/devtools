import generateApi from '@/commands/generateApi';
import Error from '@/components/error';
import getAutoTemplateType from '@/functions/getAutoTemplateType';
import getOpenApiData from '@/functions/getOpenApiData';
import { isValidJSIdentifier } from '@/helper/standard';
import { getAlovaJsonPath, readAlovaJson, TEMPLATE_DATA } from '@/modules/TemplateFile';
import { highPrecisionInterval, isEmpty } from '@/utils';
import type { TemplateType } from '@/wormhole';
import path from 'node:path';
import * as vscode from 'vscode';

export const CONFIG_POOL: Array<Configuration> = [];
export class Configuration {
  config: AlovaConfig;

  workspaceRootDir: string;

  autoUpdateControl: ReturnType<typeof highPrecisionInterval>;

  // 是否应该开始更新api
  shouldUpdate: boolean;

  constructor(config: AlovaConfig, workspaceRootDir: string) {
    // 配置文件
    this.config = config;
    this.workspaceRootDir = workspaceRootDir;
  }

  // 检测配置文件
  checkConfig() {
    if (!this.config.generator?.length) {
      throw new Error('No items found in the `config.generator`');
    }
    const globalKeySet = new Set<string>();
    const outputSet = new Set<string>();
    this.config.generator.forEach((item, _, arr) => {
      if (!item.input) {
        throw new Error('Field input is required in `config.generator`');
      }
      if (!item.output) {
        throw new Error('Field output is required in `config.generator`');
      }
      if (!isEmpty(item.global) && !isValidJSIdentifier(item.global)) {
        throw new Error(`\`${item.global}\` does not match variable specification`);
      }
      if (arr.length < 2) {
        return;
      }
      if (outputSet.has(path.join(item.output))) {
        throw new Error(`output \`${item.output}\` is repated`);
      }
      outputSet.add(path.join(item.output));
      if (!item.global) {
        throw new Error('Field global is required in `config.generator`');
      }
      if (globalKeySet.has(item.global)) {
        throw new Error(`global \`${item.global}\` is repated`);
      }
      globalKeySet.add(item.global);
    });
    if (typeof this.config.autoUpdate === 'object') {
      const { interval } = this.config.autoUpdate;
      const time = Number(interval);
      if (Number.isNaN(time)) {
        this.closeAutoUpdate();
        throw new Error('autoUpdate.interval must be a number');
      }
      if (time <= 0) {
        // 最少一秒钟
        throw new Error('Expected to set number which great than 1 in `config.autoUpdate.interval`');
      }
    }
  }

  getTemplateType(generator: GeneratorConfig): TemplateType {
    let type: TemplateType;
    const configType = generator.type ?? 'auto';
    // 根据配置文件中的type来判断模板类型
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

  getAllOutputPath() {
    return this.config.generator.map(generator => generator.output);
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
    let time = 60 * 5; // 默认五分钟
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
      time * 1000,
      immediate
    );
    this.autoUpdateControl.time = time;
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
      const alovaJsonPath = getAlovaJsonPath(this.workspaceRootDir, generator.output);
      return readAlovaJson(alovaJsonPath)
        .then(alovaJson => {
          TEMPLATE_DATA.set(alovaJsonPath, alovaJson);
          return alovaJson;
        })
        .catch(() => {
          TEMPLATE_DATA.delete(alovaJsonPath);
          return {};
        });
    });
    return Promise.all(allAlovaJSon);
  }
}
