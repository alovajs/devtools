import { alovaInstance } from "..";
import { buildPayload } from "../helper";
import { tag1DefaultConfig } from ".";

export function fn1(config) {
  const { url, data, mergedConfig } = buildPayload('/users/{id}', tag1DefaultConfig['fn1'], config);
  return alovaInstance.Request({
    ...mergedConfig,
    url,
    data,
    method: 'GET'
  });
}
