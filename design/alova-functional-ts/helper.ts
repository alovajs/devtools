export function buildPayload(url: string, defaultConfig: Record<string, any>, apiName: string, config: any) {
  const mergedConfig = {
    ...defaultConfig[apiName],
    ...config
  };
  const pathParams = mergedConfig.pathParams;
  const urlReplaced = url!.replace(/\{([^}]+)\}/g, (_, key) => {
    const pathParam = pathParams[key];
    return pathParam;
  });
  delete mergedConfig.pathParams;
  let data = mergedConfig.data;
  if (Object.prototype.toString.call(data) === '[object Object]' && typeof FormData !== 'undefined') {
    let hasBlobData = false;
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
      if (data[key] instanceof Blob) {
        hasBlobData = true;
      }
    }
    data = hasBlobData ? formData : data;
  }
  return {
    url: urlReplaced,
    data,
    mergedConfig
  }
}

export const setMethodDefaultConfig = <TagedMap extends Record<string, (config: any) => any>, ConfigMap extends {
  [K in keyof TagedMap]?: Partial<Parameters<TagedMap[K]>[0]>
}>(_: TagedMap, configMap: ConfigMap) => configMap;