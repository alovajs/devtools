import { defineConfig } from 'wormajs'
import { alova, alovaGlobals, axios, fetch, ky, swagger } from 'wormajs/plugin'

// ─── Worma TypeScript 示例 ──────────────────────────
// 本文件展示了单项目中配置 5 个 generator 的方式，
// 一次性生成多套模板代码，方便对比选择。
//
// 运行 `pnpm gen` 即可生成所有 API 客户端代码。

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
