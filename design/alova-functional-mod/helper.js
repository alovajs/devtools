export function buildPayload(url, defaultConfig, config) {
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };
  const pathParams = mergedConfig.pathParams;
  const urlReplaced = url.replace(/\{([^}]+)\}/g, (_, key) => {
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

/**
 * @template {Record<string, (config: any) => any>} TagedMap
 * @template {{ [K in keyof TagedMap]?: Partial<Parameters<TagedMap[K]>[0]> }} ConfigMap
 * @param {TagedMap} _
 * @param {ConfigMap} configMap
 * @returns {ConfigMap}
 */
export const setMethodDefaultConfig = (_, configMap) => configMap;