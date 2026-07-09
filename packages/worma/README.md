# worma - The OpenAPI Generator for human and AI

![](https://worma.js.org/img/banner.png)

<p align="center"><b>One OpenAPI spec. Code for developers, knowledge for AI.<br />Generate API calling functions, TypeScript types, documentation, and AI Skills in a single command.</b></p>

---

## What is worma?

worma is a universal OpenAPI code generator that works with any backend language and any frontend request library. Provide an OpenAPI spec, and worma generates:

- **API calling functions** — ready to import and use in your project
- **TypeScript type definitions** — full type safety for request/response
- **In-editor documentation** — hover docs, sidebar API explorer via VSCode extension
- **AI Skills** — structured API knowledge for coding agents (Cursor, Copilot, etc.)

## Installation

```bash
npm i wormajs -D
```

## Quick Start

```bash
# Initialize configuration
npx worma init

# Generate API code
npx worma gen
```

## Templates

worma ships with pre-built templates for popular request libraries:

| Template       | Library      | Notes                                 |
| -------------- | ------------ | ------------------------------------- |
| `alova`        | alova@3      | Functional, tree-shakeable            |
| `alovaGlobals` | alova@3      | Global `Apis.xxx`, migration-friendly |
| `axios`        | axios        | Most popular HTTP client              |
| `fetch`        | native fetch | Zero dependencies                     |
| `ky`           | ky           | Lightweight fetch wrapper             |

Custom Handlebars templates are also supported.

## Plugins

Built-in plugins include: `aiDoc`, `apifox`, `filterApi`, `importType`, `payloadModifier`, `platform`, `rename`, `tagModifier`.

## Documentation

Please refer to the [worma documentation](https://worma.js.org) for full details.

## Migration from @alova/wormhole

```bash
npx skills add alovajs/skills --skill worma-guidelines
```

Then ask your coding agent: "Please migrate this project from @alova/wormhole to worma."

## Join the community

- [Follow us on X to get the latest updates](https://x.com/alovajs)
- [Join the Discord](https://discord.gg/S47QGJgkVb)
- [Join the WeChat group](https://alova.js.org/img/wechat_qrcode.jpg)

## We need your support

If you like worma, please give us a star! It's a recognition and encouragement for our work.

## Welcome to contribute

We are honored to receive active participation from developers around the world in Issues and Discussions.

We hope to make worma a common project for everyone who is willing to participate. We encourage everyone to become a contributor to the worma community with an open and inclusive attitude. Even if you are a junior developer, as long as your ideas meet the development guidelines, please participate generously.

Effective contributions will win you a certain reputation in the worma community. Before contributing, please be sure to read the [Contribution Guide](https://github.com/alovajs/alova/blob/main/CONTRIBUTING.md) in detail.

## Changelog

[Link](https://github.com/alovajs/alova/releases)

## Contributors

<a href="https://github.com/alovajs/alova/graphs/contributors">
<img src="https://contrib.rocks/image?repo=alovajs/alova&max=30&columns=10" />
</a>

## LICENSE

[MIT](https://en.wikipedia.org/wiki/MIT_License)
