# 🧩 Worma TypeScript Flagship Example

This project integrates **6 generators** in a single configuration, showcasing worma's support for all preset templates at once, making it easy to compare the output of different templates.

## 📋 Included Templates

| #   | Template             | Output Directory         | Description                                                                                                         |
| --- | -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| ①   | `alova()`            | `src/api/alova/`         | **Functional template** — each API is exported independently, supports tree-shaking, includes `aiDoc` AI Skill docs |
| ②   | `alovaGlobals()`     | `src/api/alova-globals/` | **Global template** — all APIs are registered on the global `MyApis` object, zero imports needed                    |
| ③   | `axios()`            | `src/api/axios/`         | **Axios template** — based on an axios instance, ideal for smoothly integrating into existing axios projects        |
| ④   | `fetch()`            | `src/api/fetch/`         | **Fetch template** — zero dependencies, based on the native `fetch` API, extremely lightweight                      |
| ⑤   | `ky()`               | `src/api/ky/`            | **Ky template** — based on the modern `ky` request library, automatic JSON parsing                                  |
| ⑥   | `alova()` + fallback | `src/api/fallback/`      | **Input Array Fallback** — demonstrates automatic fallback to a local file when a remote URL fails                  |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate all API client code
npm run gen

# Run the demo to see usage
npm start
```

## 🔥 Advanced Tips

### Minimal Configuration: Try `.wormarc`

Rename `.wormarc.example` to `.wormarc`, delete `worma.config.ts`, and then run `worma gen` to use a pure JSON configuration.

### aiDoc Plugin

The `alova()` functional template in this project includes the `aiDoc()` plugin. After generation, AI Skill description documents will be produced in the `aidocs/` directory, which can be directly used as Skills for AI coding assistants.

## 📖 Further Reading

- [Worma Documentation](https://github.com/alovajs/devtools)
- [Detailed worma.config Configuration](./worma.config.ts)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/typescript)
