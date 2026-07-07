import { defineConfig } from 'wormajs'
import { alova, alovaGlobals, axios, fetch, ky, platform } from 'wormajs/plugin'

// ─── Worma ESM example ───────────────────────────────────
// This project demonstrates how to use worma in a "type": "module"
// JavaScript project to generate ES Module format API client code.

export default defineConfig({
  generator: [

    // ① alova function template
    //   Generates standalone API functions, each exported separately
    {
      input: 'petstore.json',
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [platform('swagger'), alova()],
    },

    // ② alovaGlobals global template
    //   Registers all APIs on a global object, usable without import
    {
      input: 'petstore.json',
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [platform('swagger'), alovaGlobals({ global: 'MyApis' })],
    },

    // ③ axios template
    //   Based on axios instance, automatically injects axios interceptors
    {
      input: 'petstore.json',
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [platform('swagger'), axios()],
    },

    // ④ fetch template
    //   Zero dependencies, based on native fetch, suitable for lightweight projects
    {
      input: 'petstore.json',
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [platform('swagger'), fetch()],
    },

    // ⑤ ky template
    //   Based on ky request library, auto JSON parsing and error handling
    {
      input: 'petstore.json',
      output: 'src/api/ky',
      serverName: 'Ky',
      plugins: [platform('swagger'), ky()],
    },
  ],
})
