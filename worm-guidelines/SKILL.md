---
name: worma-guidelines
description: worma OpenAPI code generation and configuration. Use this skill whenever the user mentions worma config, API code generation, OpenAPI/Swagger integration, worma CLI, or migration from @alova/wormhole. Trigger for questions about worma.config, npx worma init/gen, or generating API code from OpenAPI specs.
---

# worma — Universal OpenAPI Code Generator

Pick the scenario that matches the user's need, then fetch the detailed information from the corresponding docs link before answering.

## Scenario Guides

| Scenario                               | Docs Link                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First time setup / install & configure | [Installation & Configuration](https://worma.js.org/llms.mdx/docs/guide/installation-config.md)                                                           |
| Quick start                            | [Quick Start](https://worma.js.org/llms.mdx/docs/quick-start.md)                                                                                          |
| Migrate from `@alova/wormhole`         | [Migration Guide](https://worma.js.org/llms.mdx/docs/migration.md)                                                                                        |
| CLI commands (`init`, `gen`, etc.)     | [CLI Commands](https://worma.js.org/llms.mdx/docs/cli-commands.md)                                                                                        |
| Write custom Handlebars templates      | [Custom Templates](https://worma.js.org/llms.mdx/docs/template-system/custom-templates.md)                                                                |
| Build your own plugin                  | [Custom Plugin](https://worma.js.org/llms.mdx/docs/plugin-system/custom-plugin.md) / [Plugin API](https://worma.js.org/llms.mdx/docs/api/plugin-api.md)   |
| Programmatic API                       | [Core Functions](https://worma.js.org/llms.mdx/docs/api/core-functions.md) / [Configuration API](https://worma.js.org/llms.mdx/docs/api/configuration.md) |
| Generate AI Skill docs                 | [AI Skills](https://worma.js.org/llms.mdx/docs/ai-skills/index.md)                                                                                        |
| VSCode extension                       | [Editor Docs](https://worma.js.org/llms.mdx/docs/guide/editor-docs.md)                                                                                    |
| Monorepo setup                         | [Monorepo](https://worma.js.org/llms.mdx/docs/guide/monorepo.md)                                                                                          |
| Performance tuning                     | [Performance](https://worma.js.org/llms.mdx/docs/performance.md)                                                                                          |

## Predefined Templates

worma ships with request-library templates such as `alova`, `axios`, `fetch`, and `ky`. Use them in `generator.plugins` to control how API code is generated.

→ See [Predefined Templates](https://worma.js.org/llms.mdx/docs/template-system/predefined-templates.md) for usage, options, and examples.

> **Using the alova template?** Install the alova skills for better client/server API usage guidance:
>
> ```bash
> npx skills add https://github.com/alovajs/skills --skill alova-client-usage
> npx skills add alovajs/skills --skill alova-server-usage
> ```

## Predefined Plugins

Add these plugins to `generator.plugins` to customize the generation pipeline.

| Plugin              | Description                                                          | Docs                                                                                                    |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `aiDoc()`           | Generates AI-readable interface docs for coding assistants.          | [aiDoc](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/aiDoc.md)                      |
| `platform()`        | Auto-assembles OpenAPI URLs for Swagger, Knife4j, FastAPI, and YApi. | [platform](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/platform.md)                |
| `apifox()`          | Imports OpenAPI documents directly from Apifox.                      | [apifox](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/apifox.md)                    |
| `rename()`          | Renames/transforms API URLs and parameters.                          | [rename](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/rename.md)                    |
| `tagModifier()`     | Modifies the `tags` of APIs in the OpenAPI spec.                     | [tagModifier](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/tag-modifier.md)         |
| `payloadModifier()` | Adds, removes, or changes request/response parameter types.          | [payloadModifier](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/payload-modifier.md) |
| `filterApi()`       | Filters APIs by URL or tag with matching rules.                      | [filterApi](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/filter-api.md)             |
| `importType()`      | Reuses external types and excludes auto-generated types.             | [importType](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/import-type.md)           |

→ See [Built-in Plugins Overview](https://worma.js.org/llms.mdx/docs/plugin-system/builtin-plugins/index.md) for shared usage patterns and more details.
