import type { ApiDescriptor } from '@/type/base';
import type { GeneratorConfig } from '@/type/config';

export interface PluginContext {
  url: string;
  method: string;
  readonly config: GeneratorConfig;
  readonly apiDescriptor: ApiDescriptor;
}

export interface ApiPlugin {
  name?: string;
  /**
   * apply plugin to the apiDescriptor
   * @param context
   * @returns a valid ApiDescriptor object, otherwise skip the processing of this path
   */
  apply(context: PluginContext): ApiDescriptor | void | undefined | null;
}
