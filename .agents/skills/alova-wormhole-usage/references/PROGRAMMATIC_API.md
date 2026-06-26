# Programmatic API

Use `@alova/wormhole` directly in scripts or CI/CD pipelines.

## `readConfig(projectPath?)`

Read and parse the `alova.config` file.

```ts
import { readConfig } from '@alova/wormhole';

const config = await readConfig();
// or specify a project path:
const config = await readConfig('./my-project');
```

## `generate(config, options?)`

Generate API code from a config object.

```ts
import { readConfig, generate } from '@alova/wormhole';

const config = await readConfig();
const results = await generate(config, {
  force: false, // skip update check
  projectPath: './',
});
// results: boolean[] — true if each generator succeeded
```

## `createConfig(options?)`

Create an `alova.config` file programmatically.

```ts
import { createConfig } from '@alova/wormhole';

await createConfig({
  projectPath: './',
  type: 'typescript', // 'typescript' | 'module' | 'commonjs'
});
```

## `resolveWorkspaces(projectPath?)`

Find all sub-packages containing an `alova.config` in a Monorepo.

```ts
import { resolveWorkspaces } from '@alova/wormhole';

const workspaces = await resolveWorkspaces('./');
// returns: string[] — relative paths of packages with a config file
```
