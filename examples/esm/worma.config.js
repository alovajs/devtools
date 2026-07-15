import { defineConfig } from 'wormajs'
import { alova, alovaGlobals, axios, fetch, ky, swagger } from 'wormajs/plugin'

// ─── Worma ESM example ───────────────────────────────────
// This project demonstrates how to use worma in a "type": "module"
// JavaScript project to generate ES Module format API client code.

export default defineConfig({
  generator: [

    // ① alova function template
    //   Generates standalone API functions, each exported separately
    {
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [swagger('petstore.json'), alova()],
    },

    // ② alovaGlobals global template
    //   Registers all APIs on a global object, usable without import
    {
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [swagger('petstore.json'), alovaGlobals({ global: 'MyApis' })],
    },

    // ③ axios template
    //   Based on axios instance, automatically injects axios interceptors
    {
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [swagger('petstore.json'), axios()],
    },

    // ④ fetch template
    //   Zero dependencies, based on native fetch, suitable for lightweight projects
    {
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [swagger('petstore.json'), fetch()],
    },

    // ⑤ ky template
    //   Based on ky request library, auto JSON parsing and error handling
    {
      output: 'src/api/ky',
      serverName: 'Ky',
      plugins: [swagger('petstore.json'), ky()],
    },
  ],
})
