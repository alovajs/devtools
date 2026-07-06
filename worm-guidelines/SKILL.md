---
name: worma-guidelines
description: worma OpenAPI code generation and configuration. Use this skill whenever the user mentions worma config, API code generation, OpenAPI/Swagger integration, worma CLI, or migration from @alova/wormhole. Trigger for questions about worma.config, npx worma init/gen, or generating API code from OpenAPI specs.
---

# worma — Universal OpenAPI Code Generator

> **One OpenAPI spec → API calling code + TypeScript types + editor docs + AI Skills.**

worma is a universal OpenAPI code generator that turns a single OpenAPI spec into everything both developers and AI coding agents need.

## Installation

For full installation and setup guide, read the official docs:
→ [Installation & Configuration](https://worma.js.org/docs/guide/installation-config.md)

Quick install:

```bash
npm i wormajs -D
npx worma init
npx worma gen
```

## Migration from @alova/wormhole

worma is the successor to `@alova/wormhole`. For a complete migration guide:
→ [Migration Guide](https://worma.js.org/docs/migration.md)

Key changes:

- Package: `npm i wormajs -D` (was `@alova/wormhole`)
- Import: `from 'wormajs'` (was `from '@alova/wormhole'`)
- Plugins: `from 'wormajs/plugin'` (was `from '@alova/wormhole/plugin'`)
- Config: rename `alova.config.{js,ts}` → `worma.config.{js,ts}`
- CLI: `worma init` / `worma gen` (was `alova init` / `alova gen`)
- Templates must be explicitly set in `plugins` array
- `platform` is now a plugin, not a config field

## Configuration

worma uses `worma.config.js` (or `.cjs`, `.mjs`, `.ts`):

```js
import { defineConfig } from 'wormajs';
import { alova, aiDoc, platform } from 'wormajs/plugin';

export default defineConfig({
  generator: [{
    input: 'https://api.example.com/openapi.json',
    output: 'src/api',
    plugins: [platform('swagger'), alova(), aiDoc()],
  }],
});
```

Full configuration reference:
→ [Installation & Configuration](https://worma.js.org/docs/guide/installation-config.md)

## CLI Commands

→ [CLI Commands Reference](https://worma.js.org/docs/cli-commands.md)

```bash
npx worma init           # Create worma.config.js
npx worma init -T axios  # With template preset
npx worma gen             # Generate API code
npx worma gen -f          # Force regenerate
npx worma gen -p ./pkg    # Specific project
```

## Templates

worma supports multiple request libraries as template plugins:

→ [Predefined Templates](https://worma.js.org/docs/template-system/predefined-templates.md)

| Template         | Library      | Use Case                                |
| ---------------- | ------------ | --------------------------------------- |
| `alova()`        | alova@3      | Functional, tree-shakeable              |
| `alovaGlobals()` | alova@3      | Global `Apis.xxx`, migration-compatible |
| `axios()`        | axios        | Most popular HTTP client                |
| `fetch()`        | native fetch | Zero dependencies                       |
| `ky()`           | ky           | Lightweight fetch wrapper               |

Custom Handlebars templates:
→ [Custom Templates](https://worma.js.org/docs/template-system/custom-templates.md)

## Data Source Plugins

### platform — auto-resolve OpenAPI URLs

→ [Platform Plugin](https://worma.js.org/docs/plugin-system/builtin-plugins/platform.md)

```js
import { platform } from 'wormajs/plugin';
plugins: [platform('swagger'), alova()]
// input: 'https://petstore3.swagger.io'
// → resolves to multiple OpenAPI URL attempts
```

Supported: `swagger`, `knife4j`, `fastapi`, `yapi`

### apifox — import from Apifox projects

→ [Apifox Plugin](https://worma.js.org/docs/plugin-system/builtin-plugins/apifox.md)

```js
import { apifox } from 'wormajs/plugin';
plugins: [apifox({ projectId: 'xxx', apifoxToken: 'xxx' }), axios()]
// No need to set `input` — apifox handles it
```

## Built-in Plugins

→ [Built-in Plugins Overview](https://worma.js.org/docs/plugin-system/builtin-plugins/index.md)

| Plugin            | Description                              | Docs                                                                             |
| ----------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `aiDoc`           | Generate AI Skill docs for coding agents | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/aiDoc.md)            |
| `platform`        | Auto-resolve OpenAPI URLs by platform    | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/platform.md)         |
| `apifox`          | Import from Apifox projects              | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/apifox.md)           |
| `rename`          | Rename functions/params                  | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/rename.md)           |
| `tagModifier`     | Modify API tags                          | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/tag-modifier.md)     |
| `payloadModifier` | Add/remove/modify param types            | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/payload-modifier.md) |
| `filterApi`       | Filter by URL and tag                    | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/filter-api.md)       |
| `importType`      | Reuse external types                     | [→](https://worma.js.org/docs/plugin-system/builtin-plugins/import-type.md)      |

### Plugin Lifecycle

Plugins execute through 8 lifecycle hooks: `config` → `beforeOpenapiParse` → `openapiParsed` → `getTemplate` → `beforeCodeGenerate` → `onHandlebarsCreated` → `beforeFileWrite` → `codeGenerated`.

→ [Plugin API](https://worma.js.org/docs/api/plugin-api.md)
→ [Custom Plugin Guide](https://worma.js.org/docs/plugin-system/custom-plugin.md)

## Programmatic API

→ [Core Functions API](https://worma.js.org/docs/api/core-functions.md)

```js
import { generate, readConfig, createConfig, resolveWorkspaces, getApiDocs } from 'wormajs';

// Generate with progress
await generate(config, { force: true, projectPath: './' });

// Read config
const config = await readConfig('/path/to/project');

// Create config file
await createConfig({ template: 'alova', type: 'typescript' });

// Find workspace packages
const dirs = await resolveWorkspaces('/path/to/monorepo');
```

## AI Skills

The `aiDoc` plugin generates Skills-compliant docs for coding agents:
→ [AI Skills Integration](https://worma.js.org/docs/ai-skills/index.md)

## VSCode Extension

Install the Worma VSCode extension to get hover docs, sidebar API explorer, and auto-change detection:
→ [Editor Documentation](https://worma.js.org/docs/guide/editor-docs.md)

## References

| Topic                 | Link                                                              |
| --------------------- | ----------------------------------------------------------------- |
| Quick Start           | https://worma.js.org/docs/quick-start.md                          |
| Installation & Config | https://worma.js.org/docs/guide/installation-config.md            |
| CLI Commands          | https://worma.js.org/docs/cli-commands.md                         |
| Migration Guide       | https://worma.js.org/docs/migration.md                            |
| Templates             | https://worma.js.org/docs/template-system/predefined-templates.md |
| Custom Templates      | https://worma.js.org/docs/template-system/custom-templates.md     |
| Built-in Plugins      | https://worma.js.org/docs/plugin-system/builtin-plugins/index.md  |
| Custom Plugins        | https://worma.js.org/docs/plugin-system/custom-plugin.md          |
| Plugin API            | https://worma.js.org/docs/api/plugin-api.md                       |
| Core Functions        | https://worma.js.org/docs/api/core-functions.md                   |
| Configuration API     | https://worma.js.org/docs/api/configuration.md                    |
| AI Skills             | https://worma.js.org/docs/ai-skills/index.md                      |
| Editor Docs (VSCode)  | https://worma.js.org/docs/guide/editor-docs.md                    |
| Monorepo Support      | https://worma.js.org/docs/guide/monorepo.md                       |
| Performance           | https://worma.js.org/docs/performance.md                          |
