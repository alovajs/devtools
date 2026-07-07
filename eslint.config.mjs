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
    "packages/worma/typings",
    "design",
    "test/**/src/*",
    "test/**/{*openapi*.*,*swagger*.*,alova_tmp*.*}",
    ".agents",
    ".codebuddy",
    ".codebuddy/**",
    ".next",
    "**/.source",
    "**/*.tsbuildinfo"
  ],
  markdown: false,
  formatters: true,
  pnpm: true,
  vue: true,
})
  .removeRules("node/prefer-global/process")
  .overrideRules({
    "pnpm/json-enforce-catalog": [
      "error",
      {
        ignores: [
          "alova",
          "@types/vscode",
          "@orama/orama",
          "fumadocs-core",
          "fumadocs-mdx",
          "fumadocs-ui",
          "lucide-react",
          "mermaid",
          "next",
          "next-themes",
          "playwright",
          "react",
          "react-dom",
          "tailwind-merge",
          "@tailwindcss/postcss",
          "@types/mdx",
          "@types/node",
          "@types/react",
          "@types/react-dom",
          "oxlint",
          "postcss",
          "serve",
          "tailwindcss",
          "typescript"
        ],
        allowedProtocols: [
          "workspace",
          "link",
          "file"
        ],
      },
    ],
  });
