import { Loader, LoaderSync } from 'cosmiconfig';
import { existsSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
let typescript: typeof import('typescript');
export const loadTs: Loader = async function loadTs(filepath, content) {
  if (typescript === undefined) {
    typescript = (await import('typescript')).default;
  }
  let transpiledContent;
  try {
    const config = resolveTsConfig(path.dirname(filepath)) ?? {};
    config.compilerOptions = {
      ...config.compilerOptions,
      module: typescript.ModuleKind.ES2022,
      moduleResolution: typescript.ModuleResolutionKind.Bundler,
      target: typescript.ScriptTarget.ES2022,
      noEmit: false
    };
    transpiledContent = typescript.transpileModule(content, config).outputText;
  } catch (error: any) {
    error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
    throw error;
  }
  return createTempFile(filepath, transpiledContent, 'mjs', mjsPath => loadJs(mjsPath, transpiledContent));
};
let importFresh: typeof import('import-fresh');
export const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }
  return importFresh(filepath);
};
export const loadEsModule = async (filepath: string) => {
  const { href } = pathToFileURL(filepath);
  return (await import(`${href}?t=${Date.now()}`)).default;
};
export const createTempFile = async <T = any>(
  filepath: string,
  content: string,
  ext: 'cjs' | 'mjs',
  callback?: (compiledFilepath: string) => T | Promise<T>
) => {
  const compiledFilepath = `${filepath.slice(0, -2)}${ext}`;
  try {
    await writeFile(compiledFilepath, content);
    return callback?.(compiledFilepath);
  } finally {
    if (existsSync(compiledFilepath)) {
      await rm(compiledFilepath);
    }
  }
};
export const loadJs: Loader = async function loadJs(filepath, content) {
  try {
    return loadJsSync(filepath, '');
  } catch (error) {
    try {
      return await loadEsModule(filepath);
    } catch (requireError: any) {
      const errorStr = requireError.toString();
      if (errorStr.includes("SyntaxError: Unexpected token 'export'")) {
        return createTempFile(filepath, content, 'mjs', mjsPath => loadEsModule(mjsPath));
      }
      if (
        errorStr.includes(
          'contains "type": "module". To treat it as a CommonJS script, rename it to use the \'.cjs\' file extension'
        )
      ) {
        return createTempFile(filepath, content, 'cjs', cjsPath => loadJsSync(cjsPath, ''));
      }
      if (
        requireError.code === 'ERR_REQUIRE_ESM' ||
        (requireError instanceof SyntaxError &&
          requireError.toString().includes('Cannot use import statement outside a module'))
      ) {
        throw error;
      }
      throw requireError;
    }
  }
};
function resolveTsConfig(directory: string): any {
  const filePath = typescript.findConfigFile(directory, fileName => {
    return typescript.sys.fileExists(fileName);
  });
  if (filePath !== undefined) {
    const { config, error } = typescript.readConfigFile(filePath, path => typescript.sys.readFile(path));
    if (error) {
      throw new Error(`Error in ${filePath}: ${error.messageText.toString()}`);
    }
    return config;
  }
  return;
}
