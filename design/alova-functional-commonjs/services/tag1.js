const { alovaInstance } = require("..");
const { buildPayload } = require("../helper");
const { tag1DefaultConfig } = require(".");

function fn1(config) {
  const { url, data, mergedConfig } = buildPayload('/users/{id}', tag1DefaultConfig['fn1'], config);
  return alovaInstance.Request({
    ...mergedConfig,
    url,
    data,
    method: 'GET'
  });
}

module.exports = {
  fn1
};
