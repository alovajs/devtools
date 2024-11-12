const { fs } = require('memfs');
const originalFs = require('fs/promises');

const realfsPatterns = [/\.handlebars$/, /openapis/];
const isMatchRealFs = path => realfsPatterns.some(pattern => pattern.test(path));

module.exports = {
  ...fs.promises,
  readFile(...args) {
    return isMatchRealFs(args[0]) ? originalFs.readFile(...args) : fs.promises.readFile(...args);
  },
  writeFile(...args) {
    return fs.promises.writeFile(...args);
  }
};
