# 🧩 Worma ESM Example

A worma JavaScript project using the **ES Module** (`"type": "module"`) format. It covers all 5 preset templates.

## 📋 Included Templates

| #   | Template         | Output Directory         | Description                                               |
| --- | ---------------- | ------------------------ | --------------------------------------------------------- |
| ①   | `alova()`        | `src/api/alova/`         | Functional template — each API is exported independently  |
| ②   | `alovaGlobals()` | `src/api/alova-globals/` | Global template — APIs are mounted on the `MyApis` object |
| ③   | `axios()`        | `src/api/axios/`         | Axios template — based on an axios instance               |
| ④   | `fetch()`        | `src/api/fetch/`         | Fetch template — zero dependencies, native fetch          |
| ⑤   | `ky()`           | `src/api/ky/`            | Ky template — modern `ky` request library                 |

## 🚀 Quick Start

```bash
npm install      # Install dependencies
npm run gen      # Generate the API client
npm start        # Run the demo
```

## 💡 Differences from the TypeScript Example

ESM projects use `.js` file extensions and do not require a `tsconfig.json`, making them suitable for pure JavaScript projects. The generated code also supports JSDoc comments, so you can get type hints in VSCode.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/esm)
