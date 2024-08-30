import { DEFAULT_CONFIG } from '@/wormhole';
import { loadEsmModule } from '@/wormhole/utils';
import { Loader, LoaderSync } from 'cosmiconfig';
import importFresh from 'import-fresh';
import { existsSync, mkdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

let typescript: typeof import('typescript');
export const loadTs: Loader = async function loadTs(filepath, content) {
  const ts = await DEFAULT_CONFIG.getTypescript();
  if (typescript === undefined && ts) {
    typescript = ts;
  }
  if (!typescript) {
    throw new Error('typescript dependencie is required');
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
  return createTempFile(filepath, transpiledContent, 'js', jsPath => loadJs(jsPath, transpiledContent));
};

export const loadJsSync: LoaderSync = importFresh;

export const loadEsModule = async (filepath: string) => {
  const { href } = pathToFileURL(filepath);
  return (await loadEsmModule<any>(`${href}?t=${Date.now()}`)).default;
};
export const createTempFile = async <T = any>(
  filepath: string,
  content: string,
  ext: 'cjs' | 'mjs' | 'js',
  callback?: (compiledFilepath: string) => T | Promise<T>
) => {
  const parsedPath = path.parse(filepath);
  const addPath = DEFAULT_CONFIG.alovaTempPath;
  const dirPath = path.join(parsedPath.dir, parsedPath.dir.includes(addPath) ? '' : addPath);
  const compiledFilepath = path.join(dirPath, `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  let result = null;
  try {
    await writeFile(compiledFilepath, content);
    result = await callback?.(compiledFilepath);
  } finally {
    if (existsSync(compiledFilepath)) {
      await rm(compiledFilepath);
    }
  }
  return result as T;
};
export const loadJs: Loader = async function loadJs(filepath, content) {
  try {
    return await createTempFile(filepath, content, 'js', jspath => loadJsSync(jspath, ''));
  } catch (requireError: any) {
    try {
      return await loadEsModule(filepath);
    } catch (error: any) {
      const errorStr = requireError.toString() + error.toString();
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
        throw new Error(error.toString());
      }
      throw new Error(requireError.toString());
    }
  }
};
function resolveTsConfig(directory: string): any {
  const filePath = typescript.findConfigFile(directory, fileName => typescript.sys.fileExists(fileName));
  if (filePath !== undefined) {
    const { config, error } = typescript.readConfigFile(filePath, path => typescript.sys.readFile(path));
    if (error) {
      throw new Error(`Error in ${filePath}: ${error.messageText.toString()}`);
    }
    return config;
  }
}
