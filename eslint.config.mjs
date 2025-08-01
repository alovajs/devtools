// @ts-check
import antfu from "@antfu/eslint-config";

export default antfu({
  ignores: [
    "**/out",
    "**/dist",
    "**/__mocks__",
    "**/*.handlebars",
    "**/.vscode-test",
    "*.{js,mjs,cjs}",
    "**/e2e-out",
    "packages/wormhole/typings",
    "design",
    "test/**/src/*",
    "test/**/{*openapi*.*,*swagger*.*,alova_tmp*.*}",
  ],
  markdown: false,
  unocss: true,
  formatters: true,
  pnpm: true,
  vue: true,
})
  .removeRules("node/prefer-global/process")
  .overrideRules({
    "pnpm/json-enforce-catalog": [
      "error",
      {
        allowedProtocols: [
          "workspace",
          "link",
          "file",
          // @types/vscode keep version in packge.json
          "^1.89.0"
        ],
      },
    ],
  });
