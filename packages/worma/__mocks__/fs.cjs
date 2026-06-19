const { fs } = require('memfs');
const originalFs = require('fs');

const realfsPatterns = [/\.handlebars$/, /\.hbs$/, /openapis/, /template[/\\]presets/, /presets[/\\]/, /__snapshots__/];
const isMatchRealFs = path => realfsPatterns.some(pattern => pattern.test(path));

module.exports = {
  ...fs,
  readFile(...args) {
    return isMatchRealFs(args[0]) ? originalFs.readFile(...args) : fs.readFile(...args);
  },
  readFileSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.readFileSync(...args) : fs.readFileSync(...args);
  },
  readdirSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.readdirSync(...args) : fs.readdirSync(...args);
  },
  statSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.statSync(...args) : fs.statSync(...args);
  },
  accessSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.accessSync(...args) : fs.accessSync(...args);
  },
  existsSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.existsSync(...args) : fs.existsSync(...args);
  },
  writeFileSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.writeFileSync(...args) : fs.writeFileSync(...args);
  },
  mkdirSync(...args) {
    return isMatchRealFs(args[0]) ? originalFs.mkdirSync(...args) : fs.mkdirSync(...args);
  }
};
