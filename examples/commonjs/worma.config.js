const { defineConfig } = require('wormajs')
const { alova, alovaGlobals, axios, fetch, swagger } = require('wormajs/plugin')

// ─── Worma CommonJS example ─────────────────────────────
// This project demonstrates how to use worma in a CommonJS
// project to generate CJS format API client code.
// Note: ky template does not support CommonJS, so only 4 templates here.

module.exports = defineConfig({
  generator: [

    // ① alova function template
    //   Uses require/module.exports convention
    {
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [swagger('petstore.json'), alova()],
    },

    // ② alovaGlobals global template
    //   Registers all APIs globally, no import needed
    {
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [swagger('petstore.json'), alovaGlobals({ global: 'MyApis' })],
    },

    // ③ axios template
    //   Based on CommonJS axios
    {
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [swagger('petstore.json'), axios()],
    },

    // ④ fetch template
    //   Zero dependency native fetch
    {
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [swagger('petstore.json'), fetch()],
    },
  ],
})
