# Troubleshooting

| Problem                                    | Solution                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| TypeScript types not working               | Set `"strictNullChecks": true` in `tsconfig.json`                                                    |
| API inferred as `any`                      | Confirm the API is imported in the entry file; check if the OpenAPI spec is missing type definitions |
| VSCode extension not available in WebStorm | Use `npx alova gen` from the command line instead                                                    |
| Generated code not updating                | Use `npx alova gen -f` to force regeneration                                                         |
| Monorepo: config not found                 | Use `npx alova gen -w`; each sub-package needs its own `alova.config`                                |
| `output` path conflict                     | Each `generator` entry must have a unique `output` directory                                         |
| Remote URL fetch fails                     | Check network access; confirm the URL returns valid JSON/YAML                                        |
