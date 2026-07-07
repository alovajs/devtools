# worma - Universal OpenAPI Code Generator

[![npm version](https://img.shields.io/npm/v/wormajs)](https://www.npmjs.com/package/wormajs)
[![license](https://img.shields.io/github/license/alovajs/devtools)](https://github.com/alovajs/devtools/blob/main/LICENSE)

> **One OpenAPI spec. Code for developers, knowledge for AI.**

worma is a universal OpenAPI code generator that simultaneously produces API calling code, TypeScript types, documentation, and AI Skills — for both humans and coding agents.

## Key Features

### 🤖 AI Skill Generation

Auto-generate Skills-compliant API documentation that enables coding agents (Cursor, Copilot, Claude Code, Windsurf, etc.) to call your APIs accurately — correct function names, parameters, and import paths every time.

### 🧩 Four Outputs from One Source

One OpenAPI spec generates:

- **API calling functions** for developers to import directly
- **TypeScript type definitions** for type safety
- **In-editor documentation** via VSCode extension
- **AI Skills** for coding agents to read

### 🔌 Multi-Request-Library + Custom Templates

Built-in templates for Alova, Axios, Fetch, and Ky. Switch request libraries with a single config change. Full Handlebars-based custom template support.

### 📝 In-Editor API Docs

Install the VSCode extension to view complete API documentation on hover — parameter tables, response structures, and examples — even in plain JavaScript projects.

## Quick Start

```bash
# Install worma for your coding agent
npx skills add alovajs/skills --skill worma-guidelines

# Or install the CLI package directly
npm i wormajs -D
npx worma init
# Edit worma.config.js with your OpenAPI URL, then:
npx worma gen
```

## Documentation

- [Full Documentation](https://worma.js.org)
- [Quick Start Guide](https://worma.js.org/docs/quick-start)
- [Migration from @alova/wormhole](https://worma.js.org/docs/migration)
- [Plugin System](https://worma.js.org/docs/plugin-system)

## Changelog

[Changelog](https://github.com/alovajs/devtools/releases)

## Contributors

<a href="https://github.com/alovajs/devtools/graphs/contributors">
<img src="https://contrib.rocks/image?repo=alovajs/devtools&max=30&columns=10" />
</a>

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
