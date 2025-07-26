/// <reference types="vite/client" />
/// <reference types="@czhlin/vite-plugin-vscode/env" />
interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_IS_VSCODE: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
