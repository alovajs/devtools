const { defineConfig } = require('worma')
const { alova, alovaGlobals, axios, fetch, platform } = require('worma/plugin')

// ─── Worma CommonJS 示例 ─────────────────────────────
// 该项目展示在 CommonJS 项目中如何使用 worma 生成
// CJS 格式的 API 客户端代码。
// 注意：ky 模板不支持 CommonJS，故此处仅 4 套模板。

module.exports = defineConfig({
  generator: [

    // ① alova 函数式模板
    //   使用 require/module.exports 规范
    {
      input: 'petstore.json',
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [platform('swagger'), alova()],
    },

    // ② alovaGlobals 全局式模板
    //   所有 API 全局注册，无需导入
    {
      input: 'petstore.json',
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [platform('swagger'), alovaGlobals({ global: 'MyApis' })],
    },

    // ③ axios 模板
    //   基于 CommonJS 的 axios
    {
      input: 'petstore.json',
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [platform('swagger'), axios()],
    },

    // ④ fetch 模板
    //   零依赖的原生 fetch
    {
      input: 'petstore.json',
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [platform('swagger'), fetch()],
    },
  ],
})
