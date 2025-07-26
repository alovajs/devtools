import auto, { autocomplete } from './autocomplete'
import codeLen from './codeLen'
import codeSnippet, { helpeSnippet, insertSnippet, openSnippet } from './codeSnippet'
import docs, { openDocs, refreshDocs } from './docs'
import generate, { createConfig, generateApi, refresh } from './generate'
import statusBar, { showStatusBarIcon } from './statusBar'

export * from './commands'
export const commandsMap = {
  autocomplete,
  generateApi,
  refresh,
  createConfig,
  showStatusBarIcon,
  openDocs,
  refreshDocs,
  helpeSnippet,
  insertSnippet,
  openSnippet,
}
export const commands = Object.values(commandsMap)
export type CommandKey = keyof typeof commandsMap
const m: ExtensionModule = function (ctx) {
  return [auto(ctx), docs(ctx), generate(ctx), statusBar(ctx), codeSnippet(ctx), codeLen(ctx)].flat()
}

export default m
