# Troubleshooting

→ Full guide: [Installation & Configuration](https://worma.js.org/docs/guide/installation-config.md)

| Problem                         | Solution                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| TypeScript types not working    | Set `"strictNullChecks": true` in `tsconfig.json`             |
| API inferred as `any`           | Check if OpenAPI spec is missing type definitions             |
| Generated code not updating     | `npx worma gen -f` to force regenerate                        |
| Monorepo: config not found      | Each sub-package needs its own `worma.config`                 |
| Remote URL fetch fails          | Check network; confirm URL returns valid JSON                 |
| platform('swagger') returns 404 | Try `knife4j` or `fastapi`, or use direct `input` URL         |
| Apifox integration fails        | Verify projectId and apifoxToken                              |
| Migration from @alova/wormhole  | See [Migration Guide](https://worma.js.org/docs/migration.md) |
| VSCode extension not available  | Use `npx worma gen` CLI instead                               |
