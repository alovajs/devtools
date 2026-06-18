const { setMethodDefaultConfig } = require('../helper');
const tag1 = require('./tag1');

const tag1DefaultConfig = setMethodDefaultConfig(tag1, {
  fn1: {
    headers: {
      'Authorization': 'Bearer xzy'
    },
    transform(data) {
      return {
        data,
        token: 'xvcb'
      }
    }
  }
});

module.exports = {
  tag1DefaultConfig
};
