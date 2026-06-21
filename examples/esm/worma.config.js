import { defineConfig } from 'worma'
import { alova, alovaGlobals, axios, fetch, ky, platform } from 'worma/plugin'

// ─── Worma ESM 示例 ───────────────────────────────────
// 该项目展示在 "type": "module" 的 JavaScript 项目中，
// 如何使用 worma 生成 ES Module 格式的 API 客户端代码。

export default defineConfig({
  generator: [

    // ① alova 函数式模板
    //   生成独立的 API 函数，每个函数单独 export
    {
      input: 'petstore.json',
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [platform('swagger'), alova()],
    },

    // ② alovaGlobals 全局式模板
    //   所有 API 注册到全局对象，无需 import 即可使用
    {
      input: 'petstore.json',
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [platform('swagger'), alovaGlobals({ global: 'MyApis' })],
    },

    // ③ axios 模板
    //   基于 axios 实例，自动注入 axios 拦截器
    {
      input: 'petstore.json',
      output: 'src/api/axios',
      serverName: 'Axios',
      plugins: [platform('swagger'), axios()],
    },

    // ④ fetch 模板
    //   零依赖，基于原生 fetch，适合轻量级项目
    {
      input: 'petstore.json',
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [platform('swagger'), fetch()],
    },

    // ⑤ ky 模板
    //   基于 ky 请求库，自动处理 JSON 解析与异常
    {
      input: 'petstore.json',
      output: 'src/api/ky',
      serverName: 'Ky',
      plugins: [platform('swagger'), ky()],
    },
  ],
})
