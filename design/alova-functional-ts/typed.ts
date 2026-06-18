import type { alovaInstance } from ".";
import type { Alova, AlovaGenerics, AlovaMethodCreateConfig } from "alova";

type CollapsedAlova = typeof alovaInstance;
export type Alova2MethodConfig<Responded> =
  CollapsedAlova extends Alova<
    AlovaGenerics<
      any,
      any,
      infer RequestConfig,
      infer Response,
      infer ResponseHeader,
      infer L1Cache,
      infer L2Cache,
      infer SE
    >
  >
    ? Omit<
        AlovaMethodCreateConfig<
          AlovaGenerics<Responded, any, RequestConfig, Response, ResponseHeader, L1Cache, L2Cache, SE>,
          any,
          Responded
        >,
        'params'
      >
    : never;

// Extract the return type of transform function that define in $$userConfigMap, if it not exists, use the default type.
export type ExtractResponded<
  TagedDefaultConfig extends Record<string, any>,
  UserDefinedConfig extends Alova2MethodConfig<any>,
  UnifiedConfigKey extends string,
  Default
> = UserDefinedConfig['transform'] extends (...args: any[]) => any
  ? Awaited<ReturnType<UserDefinedConfig['transform']>>
  : UnifiedConfigKey extends keyof TagedDefaultConfig
    ? TagedDefaultConfig[UnifiedConfigKey]['transform'] extends (...args: any[]) => any
      ? Awaited<ReturnType<TagedDefaultConfig[UnifiedConfigKey]['transform']>>
      : Default
  : Default;