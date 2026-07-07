# 🧩 Worma CommonJS Example

A worma JavaScript project using the **CommonJS** (`require`/`module.exports`) format. It covers 4 preset templates (the `ky` template does not support CJS).

## 📋 Included Templates

| #   | Template         | Output Directory         | Description                                                   |
| --- | ---------------- | ------------------------ | ------------------------------------------------------------- |
| ①   | `alova()`        | `src/api/alova/`         | Functional template — follows `require`/`module.exports` spec |
| ②   | `alovaGlobals()` | `src/api/alova-globals/` | Global template — registered under `MyApis`                   |
| ③   | `axios()`        | `src/api/axios/`         | Axios template — CJS-style axios                              |
| ④   | `fetch()`        | `src/api/fetch/`         | Fetch template — no third-party dependencies                  |

> ⚠️ **Note:** `ky` is a pure ESM package and does not support CommonJS, so this example does not include the `ky` template. If you need to use `ky`, please refer to the [ESM Example](../esm/).

## 🚀 Quick Start

```bash
npm install      # Install dependencies
npm run gen      # Generate the API client
npm start        # Run the demo
```

## 💡 Differences from the ESM Example

- Uses `require()` / `module.exports` instead of `import` / `export`
- Does not support the `ky` template (`ky` is a pure ESM package)
- Uses CJS module exports in the configuration file

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alovajs/devtools/tree/main/examples/commonjs)
