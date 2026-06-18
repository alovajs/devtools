const { fs } = require('memfs');
const originalFs = require('fs/promises');

const realfsPatterns = [/\.handlebars$/, /\.hbs$/, /openapis/, /template[/\\]presets/, /presets[/\\]/, /__snapshots__/];
const isMatchRealFs = path => realfsPatterns.some(pattern => pattern.test(path));

module.exports = {
  ...fs.promises,
  readFile(...args) {
    return isMatchRealFs(args[0]) ? originalFs.readFile(...args) : fs.promises.readFile(...args);
  },
  readdir(...args) {
    return isMatchRealFs(args[0]) ? originalFs.readdir(...args) : fs.promises.readdir(...args);
  },
  stat(...args) {
    return isMatchRealFs(args[0]) ? originalFs.stat(...args) : fs.promises.stat(...args);
  },
  access(...args) {
    return isMatchRealFs(args[0]) ? originalFs.access(...args) : fs.promises.access(...args);
  },
  writeFile(...args) {
    return isMatchRealFs(args[0]) ? originalFs.writeFile(...args) : fs.promises.writeFile(...args);
  },
  mkdir(...args) {
    return isMatchRealFs(args[0]) ? originalFs.mkdir(...args) : fs.promises.mkdir(...args);
  }
};
