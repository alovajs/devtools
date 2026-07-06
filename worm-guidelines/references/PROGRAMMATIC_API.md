# Programmatic API

→ Full reference: [Core Functions](https://worma.js.org/docs/api/core-functions.md)

```js
import { generate, readConfig, createConfig, resolveWorkspaces, getApiDocs } from 'wormajs';
```

### generate(config, options?)

```js
const results = await generate(config, { force: true, projectPath: './' });
```

### readConfig(projectPath?)

```js
const config = await readConfig('/path/to/project');
```

### createConfig(options?)

```js
await createConfig({ template: 'alova', type: 'typescript' });
```

### resolveWorkspaces(projectPath?)

```js
const dirs = await resolveWorkspaces('./');
```

### getApiDocs(outputs?, projectPath?)

```js
const docs = await getApiDocs();
```
