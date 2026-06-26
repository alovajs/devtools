const { defineConfig } = require('worma')
const { alova, alovaGlobals, axios, fetch, platform } = require('worma/plugin')

// ─── Worma CommonJS example ─────────────────────────────
// This project demonstrates how to use worma in a CommonJS
// project to generate CJS format API client code.
// Note: ky template does not support CommonJS, so only 4 templates here.

module.exports = defineConfig({
  generator: [

    // ① alova function template
    //   Uses require/module.exports convention
    {
      input: 'petstore.json',
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [platform('swagger'), alova()],
    },

    // ② alovaGlobals global template
    //   Registers all APIs globally, no import needed
    {
      input: 'petstore.json',
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [platform('swagger'), alovaGlobals({ global: 'MyApis' })],
    },

    // ③ axios template
    //   Based on CommonJS axios
    {
      input: 'petstore.json',
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [platform('swagger'), axios()],
    },

    // ④ fetch template
    //   Zero dependency native fetch
    {
      input: 'petstore.json',
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [platform('swagger'), fetch()],
    },
  ],
})
