import { defineConfig } from 'worma'
import { aiDoc, alova, alovaGlobals, axios, fetch, ky, platform } from 'worma/plugin'

// ─── Worma TypeScript 旗舰示例 ──────────────────────────
// 本文件展示了单项目中配置 6 个 generator 的方式，
// 一次性生成多套模板代码，方便对比选择。
//
// 运行 `pnpm gen` 即可生成所有 API 客户端代码。

export default defineConfig({
  generator: [

    /* ───── ① alova 函数式模板 ─────
     *   • 每个 API 函数独立导出，支持 tree-shaking
     *   • 附带 aiDoc 插件，自动生成 AI Skill 文档
     */
    {
      input: 'petstore.json',
      output: 'src/api/alova',
      serverName: 'Alova Functional',
      plugins: [
        platform('swagger'),
        aiDoc({ outputDir: 'aidocs' }),
        alova(),
      ],
    },

    /* ───── ② alovaGlobals 全局式模板 ─────
     *   • 所有 API 挂在全局对象 MyApis 上
     *   • 无需 import，直接 MyApis.getPetById() 调用
     */
    {
      input: 'petstore.json',
      output: 'src/api/alova-globals',
      serverName: 'Alova Globals',
      plugins: [
        platform('swagger'),
        alovaGlobals({ global: 'MyApis' }),
      ],
    },

    /* ───── ③ axios 模板 ─────
     *   • 基于 axios 实例生成，适合已有 axios 项目的接入
     *   • 自动处理请求/响应拦截
     */
    {
      input: 'petstore.json',
      output: 'src/api/axios',
      serverName: 'Axios',
      type: 'typescript',
      plugins: [
        platform('swagger'),
        axios(),
      ],
    },

    /* ───── ④ fetch 模板 ─────
     *   • 零依赖，基于原生 fetch API
     *   • 适合无第三方请求库的轻量项目
     */
    {
      input: 'petstore.json',
      output: 'src/api/fetch',
      serverName: 'Fetch',
      plugins: [
        platform('swagger'),
        fetch(),
      ],
    },

    /* ───── ⑤ ky 模板 ─────
     *   • 基于 ky 请求库（现代化 fetch 封装）
     *   • 自动 JSON 解析、超时控制
     */
    {
      input: 'petstore.json',
      output: 'src/api/ky',
      serverName: 'Ky',
      plugins: [
        platform('swagger'),
        ky(),
      ],
    },

    /* ───── ⑥ input 数组 fallback 演示 ─────
     *   • input 可以是字符串数组，依次尝试直到成功
     *   • 第一个 URL 故意写错，worma 会自动 fallback 到本地文件
     */
    {
      input: ['https://invalid.example.com/openapi.json', 'petstore.json'],
      output: 'src/api/fallback',
      serverName: 'Fallback Demo',
      plugins: [
        platform('swagger'),
        alova(),
      ],
    },
  ],
})
