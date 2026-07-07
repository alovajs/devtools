# CLI Reference

## Generate API code

```bash
npx alova gen [options]
```

| Flag               | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `-f, --force`      | Skip update check and force regenerate                                                     |
| `-c, --cwd <path>` | Working directory containing `alova.config`. Default: current directory                    |
| `-w, --workspace`  | Monorepo mode — batch generate based on `package.json` workspaces or `pnpm-workspace.yaml` |

## Create config file

```bash
npx alova init [options]
```

| Flag                | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `-t, --type <type>` | Config type: `auto` / `ts` / `typescript` / `module` / `commonjs` |
| `-c, --cwd <path>`  | Directory to create the config file. Default: current directory   |

## Generated output structure

After running `alova gen`, the `output/` directory contains:

```
src/api/
├── index.[js/ts]          ← Entry point. Safe to edit — will NOT be overwritten
├── createApis.[js/ts]     ← Auto-generated. Do not edit manually
└── apiDefinitions.[js/ts] ← Auto-generated. Do not edit manually
```
