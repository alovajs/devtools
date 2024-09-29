const { fs } = require('memfs');
const originalFs = require('fs');

const realfsPatterns = [/\.handlebars$/, /openapis/];
const isMatchRealFs = path => realfsPatterns.some(pattern => pattern.test(path));

module.exports = {
  ...fs,
  readFile(...args) {
    // console.log('readFile', args, isMatchmemFs(args[0]));
    return isMatchRealFs(args[0]) ? originalFs.readFile(...args) : fs.readFile(...args);
  },
  readFileSync(...args) {
    // console.log('readFileSync', args, isMatchmemFs(args[0]));
    return isMatchRealFs(args[0]) ? originalFs.readFileSync(...args) : fs.readFileSync(...args);
  }
};
