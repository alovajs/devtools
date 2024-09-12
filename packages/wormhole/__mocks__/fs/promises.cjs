const { fs } = require('memfs');
const originalFs = require('fs/promises');

const realfsPatterns = [/\.handlebars$/, /openapis/];
const isMatchRealFs = path => realfsPatterns.some(pattern => pattern.test(path));

module.exports = {
  ...fs.promises,
  readFile(...args) {
    // console.log('readFile promise', args, isMatchRealFs(args[0]));
    return isMatchRealFs(args[0]) ? originalFs.readFile(...args) : fs.promises.readFile(...args);
  },
  writeFile(...args) {
    // console.log('writeFile promise', args[0], isMatchRealFs(args[0]));
    return fs.promises.writeFile(...args);
  }
};
