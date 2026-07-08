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
  })
  // 这些项目需要独立克隆安装运行，禁用 catalog 强制，允许写死直接版本号。
  // 其余 packages/* 仍保持 catalog 一致性不受影响。
  // 注意：overrideRules 会对所有配置对象（含后续 append 的配置）重新写入该规则，
  // 导致 append 里的 "off" 被覆盖回 "error"。因此用 onResolved 在最终配置末尾
  // 追加，确保对 examples/benchmark 真正关闭该规则。
  .onResolved((configs) => {
    configs.push({
      files: [
        "examples/**/package.json",
        "benchmark/**/package.json",
      ],
      rules: {
        "pnpm/json-enforce-catalog": "off",
      },
    });
    return configs;
  });
